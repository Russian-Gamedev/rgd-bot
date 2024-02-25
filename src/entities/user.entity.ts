import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

import { BaseEntity } from '#lib/orm/BaseEntity';

@Entity({ tableName: 'users' })
export class UserEntity extends BaseEntity {
  @PrimaryKey()
  id: number;

  @Property()
  user_id: string;

  @Property()
  username: string;

  @Property()
  avatar: string;

  @Property({ nullable: true, default: null })
  banner: string | null;

  @Property({ nullable: true, default: null })
  banner_alt: string | null;

  @Property({ nullable: false, default: '#fff' })
  banner_color: string;

  @Property({ nullable: false, defaultRaw: 'now()' })
  first_join = new Date();

  @Property({ nullable: true, default: null })
  about: string | null;

  @Property({ nullable: true, default: null })
  invite: string | null;

  @Property({ default: false })
  left_guild: boolean;

  @Property({ default: 0 })
  experience: number;

  @Property({ default: 0 })
  coins: number;

  @Property({ default: 0 })
  leave_count: number;

  @Property({ default: 0 })
  voice_time: number;

  @Property({ nullable: true, default: null })
  birth_date: string | null;

  @Property({ default: 0 })
  reputation: number;

  is_new = false;
}
