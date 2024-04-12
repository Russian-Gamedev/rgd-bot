import { EntityManager } from '@mikro-orm/postgresql';
import { container } from '@sapphire/pieces';
import { TextChannel } from 'discord.js';

import { GuildSettingEntity } from '#base/entities/guild-setting.entity';
import { GuildSettings } from '#config/constants';

export class GuildSettingService {
  private static _instance: GuildSettingService;

  static get Instance() {
    if (!this._instance) {
      const orm = container.orm.em.fork();
      this._instance = new GuildSettingService(orm);
    }
    return this._instance;
  }

  constructor(readonly database: EntityManager) {}

  async get(guild_id: string, key: GuildSettings, fallback: string) {
    let setting = await this.database.findOne(
      GuildSettingEntity,
      { key, guild_id },
      { cache: 15_000 },
    );
    if (!setting) {
      setting = this.database.create(GuildSettingEntity, {
        key,
        value: fallback,
        guild_id,
      });
    }

    return setting.value || fallback;
  }
  set(key: GuildSettings, value: string) {
    return this.database.nativeUpdate(GuildSettingEntity, { key }, { value });
  }

  async getSystemChannel(guild_id: string) {
    const guild = await container.client.guilds.fetch(guild_id);

    const channel_id = await this.get(
      guild_id,
      GuildSettings.SystemChannel,
      guild.systemChannelId,
    );

    return (await guild.channels.fetch(channel_id)) as TextChannel;
  }
}
