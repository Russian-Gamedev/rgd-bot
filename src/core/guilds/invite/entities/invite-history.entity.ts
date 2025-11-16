import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

import { type DiscordID } from '#root/lib/types';

@Entity({ tableName: 'guild_invites_history' })
export class GuildInviteHistoryEntity {
  @PrimaryKey()
  id: number;

  @Property({ type: 'bigint' })
  guild_id: DiscordID;

  @Property({ type: 'bigint' })
  user_id: DiscordID;

  @Property()
  invite_code: string;

  @Property({ type: 'bigint' })
  invite_user: DiscordID;

  @Property({
    fieldName: 'joined_at',
    type: 'timestamptz',
    defaultRaw: 'now()',
  })
  joinedAt = new Date();

  @Property({
    fieldName: 'left_at',
    type: 'timestamptz',
    nullable: true,
  })
  leftAt: Date | null = null;
}
