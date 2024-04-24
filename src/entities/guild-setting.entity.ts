import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';

import { GuildSettings } from '#config/constants';
import { BaseEntity } from '#lib/orm/BaseEntity';

@Entity({ tableName: 'guild_settings' })
@Index({ properties: ['guild_id', 'key'] })
export class GuildSettingEntity extends BaseEntity {
  @PrimaryKey()
  id: number;

  @Property()
  guild_id: string;

  @Property()
  key: GuildSettings;

  @Property()
  value: string;
}
