import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

import { BaseEntity } from '#lib/orm/BaseEntity';

@Entity({ tableName: 'guilds' })
export class GuildEntity extends BaseEntity {
  @PrimaryKey()
  id: string;

  @Property()
  name: string;

  @Property()
  owner_id: string;
}
