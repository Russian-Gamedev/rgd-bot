import { Injectable, Logger } from '@nestjs/common';
import { Client, SendableChannels } from 'discord.js';
import Redis from 'ioredis';

import { GuildSettings } from '#config/guilds';
import { GuildSettingsService } from '#core/guilds/settings/guild-settings.service';
import { DiscordID } from '#root/lib/types';
import { hashStringToInt } from '#root/lib/utils';

import { SIGamePack } from './engine/sigame.pack';
import { SIGameState } from './engine/sigame.state';
import { SIGameService } from './sigame.service';

/**
 * Работаем с каналами, состояниями и паками игр
 * Здесь не должно быть логики игр
 */

@Injectable()
export class SIGameController {
  private readonly logger = new Logger(SIGameController.name);

  private readonly _cachedChannels = new Map<string, SendableChannels>();
  private readonly _cachedStates = new Map<string, SIGameState>();
  private readonly _cachedPackInfo = new Map<string, SIGamePack>();

  constructor(
    private readonly discord: Client,
    private readonly guildSettings: GuildSettingsService,
    private readonly redis: Redis,
    private readonly sigameService: SIGameService,
  ) {}

  /**
   * Начать игру с паком (по ID или URL)
   */
  async startPack(
    guildId: DiscordID,
    packUrlOrId: string,
  ): Promise<SIGameState> {
    // Скачиваем пак (если ещё не скачан)
    const url = await this.downloadPack(packUrlOrId);
    // Определяем ID пака
    const packId = this.resolvePackId(url);

    // Парсим пак
    const pack = await this.sigameService.parsePack(packId);
    if (!pack) {
      throw new Error('Failed to parse pack');
    }

    // Создаём состояние игры
    const state = new SIGameState(pack);

    // Сохраняем в кэш и Redis (сохраняем URL пака для возможности перезапуска)
    this._cachedStates.set(String(guildId), state);
    this._cachedPackInfo.set(String(guildId), pack);

    await this.saveGameState(guildId, state);
    await this.savePackInfo(guildId, pack);
    await this.savePackUrl(guildId, url);

    this.logger.log(`Started new game for guild ${guildId}`);
    return state;
  }

  /**
   * Перезапустить игру с тем же паком (при рестарте бота)
   * Проверяет наличие скачанного пака, скачивает заново если нужно
   */
  async restartPack(guildId: DiscordID): Promise<SIGameState> {
    const packUrl = await this.getPackUrl(guildId);
    if (!packUrl) {
      throw new Error('No pack URL found for this guild');
    }

    // Проверяем существует ли уже скачанный пак
    const packId = this.resolvePackId(packUrl);
    const packExists = await this.sigameService.checkPackExists(packId);

    if (!packExists) {
      this.logger.log(`Pack ${packId} not found, downloading again...`);
      await this.downloadPack(packUrl);
    }

    // Парсим пак
    const pack = await this.sigameService.parsePack(packId);
    if (!pack) {
      throw new Error('Failed to parse pack after restart');
    }

    // Восстанавливаем состояние игры
    const state = await this.getGameState(guildId);
    if (!state) {
      // Если состояния нет, создаём новое
      return this.startPack(guildId, packUrl);
    }

    // Обновляем кэш
    this._cachedPackInfo.set(String(guildId), pack);

    this.logger.log(`Restarted game for guild ${guildId}`);
    return state;
  }

  /**
   * Определить ID пака из строки (ID или URL)
   * Не скачивает пак, только вычисляет ID
   *
   * @param packUrlOrId - Числовой ID (например "12345") или прямая ссылка
   * @returns Числовой ID: либо оригинальный, либо хеш URL
   */
  private resolvePackId(packUrlOrId: string): number {
    const isId = /^\d+$/.test(packUrlOrId);
    if (isId) {
      return Number(packUrlOrId);
    }

    // Если это URL, вычисляем его хеш (тот же алгоритм, что в downloadPack)
    const packId = hashStringToInt(packUrlOrId);
    return Number(packId);
  }

  /**
   * Скачать пак по ID или URL
   *
   * @param packUrlOrId - Числовой ID (получит URL через API) или прямая ссылка
   */
  async downloadPack(packUrlOrId: string): Promise<string> {
    const isId = /^\d+$/.test(packUrlOrId);
    let url = packUrlOrId;

    if (isId) {
      // Если это числовой ID - получаем URL из API sibrowser.ru
      const pack = await this.sigameService.getPackById(Number(packUrlOrId));
      if (!pack) {
        throw new Error('Pack not found');
      }
      url = pack.directContentUri;
    }

    // Скачиваем пак по URL (проверка на существование внутри downloadPack)
    this.logger.log(`Downloading SIGame pack from: ${url}`);
    await this.sigameService.downloadPack(url);

    return url;
  }

  /**
   * Получить информацию о паке (из кэша или Redis)
   */
  async getPackInfo(guildId: DiscordID): Promise<SIGamePack | null> {
    if (this._cachedPackInfo.has(String(guildId))) {
      return this._cachedPackInfo.get(String(guildId))!;
    }

    const key = `sigame:pack:${guildId}`;
    const data = await this.redis.get(key);
    if (!data) return null;

    const pack = JSON.parse(data) as SIGamePack;
    this._cachedPackInfo.set(String(guildId), pack);
    return pack;
  }

  /**
   * Получить состояние игры (из кэша или Redis)
   */
  async getGameState(guildId: DiscordID): Promise<SIGameState | null> {
    if (this._cachedStates.has(String(guildId))) {
      return this._cachedStates.get(String(guildId))!;
    }

    const key = `sigame:state:${guildId}`;
    const data = await this.redis.get(key);
    if (!data) return null;

    // Восстанавливаем пак
    const pack = await this.getPackInfo(guildId);
    if (!pack) return null;

    const state = SIGameState.deserialize(data, pack);

    this._cachedStates.set(String(guildId), state);
    return state;
  }

  /**
   * Сохранить состояние игры в Redis
   */
  async saveGameState(guildId: DiscordID, state: SIGameState): Promise<void> {
    const key = `sigame:state:${guildId}`;
    const data = JSON.stringify(state.serialize());
    await this.redis.set(key, data);
  }

  /**
   * Сохранить информацию о паке в Redis
   */
  async savePackInfo(guildId: DiscordID, pack: SIGamePack): Promise<void> {
    const key = `sigame:pack:${guildId}`;
    const data = JSON.stringify(pack);
    await this.redis.set(key, data);
  }

  /**
   * Сохранить URL пака в Redis
   */
  async savePackUrl(guildId: DiscordID, packUrl: string): Promise<void> {
    const key = `sigame:packurl:${guildId}`;
    this.logger.log(`Saving pack URL for guild ${guildId}: ${packUrl}`);
    await this.redis.set(key, packUrl);
  }

  /**
   * Получить URL пака из Redis
   */
  async getPackUrl(guildId: DiscordID): Promise<string | null> {
    const key = `sigame:packurl:${guildId}`;
    return await this.redis.get(key);
  }

  /**
   * Очистить состояние игры
   */
  async clearGameState(guildId: DiscordID): Promise<void> {
    const stateKey = `sigame:state:${guildId}`;
    const packKey = `sigame:pack:${guildId}`;
    const urlKey = `sigame:packurl:${guildId}`;

    await this.redis.del(stateKey);
    await this.redis.del(packKey);
    await this.redis.del(urlKey);

    this._cachedStates.delete(String(guildId));
    this._cachedPackInfo.delete(String(guildId));

    this.logger.log(`Cleared game state for guild ${guildId}`);
  }

  /**
   * Проверить запущена ли игра
   */
  async isGameRunning(guildId: DiscordID): Promise<boolean> {
    if (this._cachedStates.has(String(guildId))) {
      return true;
    }

    const key = `sigame:state:${guildId}`;
    const exists = await this.redis.exists(key);
    return exists === 1;
  }

  async getChannel(guildId: DiscordID): Promise<SendableChannels> {
    if (this._cachedChannels.has(String(guildId))) {
      return this._cachedChannels.get(String(guildId))!;
    }
    const channelId = await this.guildSettings.getSetting<string>(
      guildId,
      GuildSettings.SIGameChannelId,
    );
    if (!channelId) {
      throw new Error('SIGame channel not configured for this guild');
    }
    const guild = await this.discord.guilds.fetch(String(guildId));
    const channel = await guild.channels.fetch(channelId);
    if (!channel?.isSendable()) {
      throw new Error('Configured SIGame channel is not sendable');
    }
    this._cachedChannels.set(String(guildId), channel as SendableChannels);
    return channel;
  }
}
