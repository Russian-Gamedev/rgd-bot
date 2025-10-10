import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

import { BaseEntity } from '#common/entities/base.entity';

@Entity({ tableName: 'users' })
export class UserEntity extends BaseEntity {
  @PrimaryKey()
  id: number;

  @Property({ type: 'bigint' })
  user_id: bigint;

  @Property({ type: 'bigint', index: true })
  guild_id: bigint;

  @Property({ type: 'text', unique: true })
  username: string;

  @Property({ type: 'text' })
  avatar: string;

  @Property({ type: 'text', nullable: true })
  banner: string | null;

  @Property({ type: 'text', nullable: true })
  banner_alt: string | null;

  @Property({ type: 'text', defaultRaw: "'#fff'" })
  banner_color = '#fff';

  @Property({ type: 'timestamptz', defaultRaw: 'now()' })
  first_joined_at: Date;

  @Property({ type: 'text', nullable: true })
  about: string | null;

  @Property({ type: 'boolean', default: false })
  is_left_guild = false;

  @Property({ type: 'timestamptz', nullable: true })
  left_at: Date | null = null;

  @Property({ type: 'integer', default: 0 })
  left_count = 0;

  @Property({ type: 'integer', default: 0 })
  coins = 0;

  @Property({ type: 'timestamptz', nullable: true })
  birth_date: Date | null = null;

  @Property({ type: 'integer', default: 0 })
  reputation: number;

  @Property({ type: 'integer', default: 0 })
  experience: number;

  @Property({ type: 'integer', default: 0 })
  voice_time: number;
}
