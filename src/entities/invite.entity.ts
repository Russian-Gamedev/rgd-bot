import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';

import { BaseEntity } from '#lib/orm/BaseEntity';

@Entity({ tableName: 'guild_invites' })
@Index({ properties: ['guild_id'] })
export class InviteEntity extends BaseEntity {
  @PrimaryKey()
  id: string;

  @Property()
  guild_id: string;

  @Property({ nullable: true, default: null })
  alias: string | null;

  @Property({ default: 0 })
  uses: number;

  @Property()
  inviter: string;
}
