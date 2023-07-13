import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PickKeysByType } from 'typeorm/common/PickKeysByType';

export type StatsKey = Exclude<PickKeysByType<BotStats, number>, 'id'>;

export class BotStats extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @UpdateDateColumn()
  date_updated: Date;

  @Column('varchar', { length: 19 })
  user: string;

  @Column('integer', { default: 0 })
  voice: number;

  @Column('integer', { default: 0 })
  chat: number;

  @Column('integer', { default: 0 })
  reactions: number;

  static async ensure(user: string) {
    let stats = await this.findOne({ where: { user } });
    if (!stats) {
      stats = this.create({ user });
    }

    return stats;
  }
}

@Entity('Bot_Stats_Day')
export class StatsDay extends BotStats {}

@Entity('Bot_Stats_Week')
export class StatsWeek extends BotStats {}
