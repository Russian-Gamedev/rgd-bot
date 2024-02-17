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

  get(key: GuildSettings, guild_id: string) {
    return this.database.findOne(
      GuildSettingEntity,
      { guild_id, key },
      { cache: 15_000 },
    );
  }
  set(key: GuildSettings, value: string, guild_id: string) {
    return this.database.nativeUpdate(
      GuildSettingEntity,
      { guild_id, key },
      { value },
    );
  }
}
