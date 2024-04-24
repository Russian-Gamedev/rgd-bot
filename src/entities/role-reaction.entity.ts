import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';

import { BaseEntity } from '#base/lib/orm/BaseEntity';

@Entity({ tableName: 'role_reactions' })
@Index({ properties: ['guild_id', 'role_id'] })
export class RoleReactionEntity extends BaseEntity {
  @PrimaryKey()
  id: number;

  @Property()
  guild_id: string;

  @Property()
  role_id: string;

  @Property()
  message_id: string;

  @Property()
  channel_id: string;

  @Property()
  emoji: string;
}
