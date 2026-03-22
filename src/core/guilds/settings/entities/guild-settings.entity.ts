import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

import { BaseEntity } from '#common/entities/base.entity';

@Entity({ tableName: 'guild_settings' })
export class GuildSettingsEntity<T> extends BaseEntity {
  @PrimaryKey()
  id: number;

  @Property({ type: 'bigint' })
  guild_id: bigint;

  @Property()
  key: string;

  @Property({ type: 'jsonb' })
  value: T;
}
