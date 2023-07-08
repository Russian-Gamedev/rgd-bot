import {
  BaseEntity,
  Column,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column('varchar')
  banner: string | null;

  @Column('varchar', { nullable: true, default: null })
  banner_alt: string | null;

  @Column('varchar')
  banner_color: string;

  @Column('bigint', {
    transformer: { to: (value) => value, from: (value) => BigInt(value) },
  })
  voiceTime: bigint;

  @Column('integer')
  reputation: number;

  @Column('integer')
  coins: number;

  @Column('integer')
  leaveCount: number;

  @Column('timestamp with time zone')
  firstJoin: Date;

  @Column('text')
  about: string;

  @Column('integer')
  experience: number;

  @Column('varchar')
  birthDate: string;

  @Column('boolean')
  leave: boolean;

  @Column('text')
  lore: string;

  static async ensure(id: string) {
    let user = await this.findOne({ where: { id } });
    if (!user) {
      user = this.create({
        id,
      });
    }

    return user;
  }
}
