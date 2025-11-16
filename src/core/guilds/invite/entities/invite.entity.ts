import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

import { BaseEntity } from '#common/entities/base.entity';
import type { DiscordID } from '#root/lib/types';

@Entity({ tableName: 'guild_invites' })
export class GuildInviteEntity extends BaseEntity {
  @PrimaryKey()
  id: string;

  @Property({ type: 'bigint' })
  guild_id: DiscordID;

  @Property({ nullable: true, default: null })
  name: string | null;

  @Property()
  uses: number;

  @Property({ type: 'bigint' })
  inviter_id: DiscordID;
}
