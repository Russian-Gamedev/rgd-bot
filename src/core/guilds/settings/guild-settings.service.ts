import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';

import { GuildSettingsEntity } from '../entities/guild-settings.entity';

@Injectable()
export class GuildSettingsService {
  constructor(
    @InjectRepository(GuildSettingsEntity)
    private readonly guildSettingsRepository: EntityRepository<
      GuildSettingsEntity<unknown>
    >,
  ) {}

  async getSetting<T>(
    guildId: bigint,
    key: string,
    defaultValue: T | null = null,
  ): Promise<T | null> {
    const setting = await this.guildSettingsRepository.findOne({
      guild_id: guildId,
      key,
    });
    return setting ? (setting.value as T) : defaultValue;
  }

  async setSetting<T>(guildId: bigint, key: string, value: T): Promise<void> {
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

  async deleteSetting(guildId: bigint, key: string): Promise<void> {
    await this.guildSettingsRepository.nativeDelete({ guild_id: guildId, key });
  }
}
