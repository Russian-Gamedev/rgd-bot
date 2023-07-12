import { GuildMember } from 'discord.js';
import {
  BaseEntity,
  Column,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { getDisplayAvatar, getDisplayBanner } from '@/lib/utils';

@Entity('user')
export class User extends BaseEntity {
  @PrimaryColumn('varchar', { length: 19 })
  id: string;

  @UpdateDateColumn()
  date_updated: Date;

  @Column('varchar')
  username: string;

  @Column('varchar')
  avatar: string;

  @Column('varchar', { nullable: true, default: null })
  banner: string | null;

  @Column('varchar', { nullable: true, default: null })
  banner_alt: string | null;

  @Column('varchar')
  banner_color: string;

  @Column('integer', {
    transformer: { to: (value) => value, from: (value) => parseInt(value) },
    default: 0,
  })
  voiceTime: number;

  @Column('integer', { default: 0 })
  reputation: number;

  @Column('integer', { default: 0 })
  coins: number;

  @Column('integer', { default: 0 })
  leaveCount: number;

  @Column('timestamp with time zone', { default: new Date() })
  firstJoin: Date;

  @Column('text', { default: '' })
  about: string;

  @Column('integer', { default: 0 })
  experience: number;

  @Column('varchar', { default: null, nullable: true })
  birthDate: string;

  @Column('boolean', { default: false })
  leave: boolean;

  @Column('text', { default: null, nullable: true })
  lore: string;

  static async ensure(member: GuildMember) {
    let user = await this.findOne({ where: { id: member.id } });
    if (!user) {
      user = this.create({
        id: member.id,
        username: member.user.username,
        avatar: getDisplayAvatar(member.user),
        banner: getDisplayBanner(member.user),
        banner_color: member.displayHexColor,
      });
      await user.save();
    }

    return user;
  }
}
