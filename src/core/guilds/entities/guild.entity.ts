import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

import { BaseEntity } from '#common/entities/base.entity';

@Entity({ tableName: 'guilds' })
export class GuildEntity extends BaseEntity {
  @PrimaryKey({ type: 'bigint' })
  id: bigint;

  @Property()
  name: string;

  @Property({ type: 'bigint' })
  owner_id: bigint;

  @Property({ nullable: true })
  icon_url?: string;

  @Property({ nullable: true })
  custom_banner_url?: string;
}
