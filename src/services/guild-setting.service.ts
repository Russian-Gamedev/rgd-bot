import { EntityManager } from '@mikro-orm/postgresql';
import { container } from '@sapphire/pieces';

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

  async get(key: GuildSettings, fallback: string, guild_id: string) {
    let setting = await this.database.findOne(
      GuildSettingEntity,
      { guild_id, key },
      { cache: 15_000 },
    );
    if (!setting) {
      setting = this.database.create(GuildSettingEntity, {
        guild_id,
        key,
        value: fallback,
      });
    }

    return setting.value || fallback;
  }
  set(key: GuildSettings, value: string, guild_id: string) {
    return this.database.nativeUpdate(
      GuildSettingEntity,
      { guild_id, key },
      { value },
    );
  }
}
