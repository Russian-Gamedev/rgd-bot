import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { Client, SendableChannels } from 'discord.js';

import { GuildSettings } from '#config/guilds';
import { DiscordID } from '#root/lib/types';

import { GuildSettingsEntity } from './entities/guild-settings.entity';

@Injectable()
export class GuildSettingsService {
  constructor(
    @InjectRepository(GuildSettingsEntity)
    private readonly guildSettingsRepository: EntityRepository<
      GuildSettingsEntity<unknown>
    >,
    private readonly discord: Client,
  ) {}

  async getSetting<T>(
    guildId: DiscordID,
    key: string,
    defaultValue: T | null = null,
  ): Promise<T | null> {
    const setting = await this.guildSettingsRepository.findOne({
      guild_id: guildId,
      key,
    });
    return setting ? (setting.value as T) : defaultValue;
  }

  async setSetting<T>(
    guildId: DiscordID,
    key: string,
    value: T,
  ): Promise<void> {
    guildId = BigInt(guildId);

    let setting = await this.guildSettingsRepository.findOne({
      guild_id: guildId,
      key,
    });
    if (!setting) {
      setting = new GuildSettingsEntity<T>();
      setting.guild_id = guildId;
      setting.key = key;
    }
    setting.value = value;
    await this.guildSettingsRepository.upsert(setting);
  }

  async deleteSetting(guildId: DiscordID, key: string): Promise<void> {
    await this.guildSettingsRepository.nativeDelete({ guild_id: guildId, key });
  }

  /// most used settings
  async getEventMessageChannel(guildId: DiscordID) {
    const channelId = await this.getSetting<string>(
      guildId,
      GuildSettings.EventMessageChannel,
      null,
    );
    if (!channelId) return null;
    const guild = await this.discord.guilds
      .fetch(String(guildId))
      .catch(() => null);
    if (!guild) return null;

    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel?.isSendable()) return null;
    return channel as SendableChannels;
  }
}
