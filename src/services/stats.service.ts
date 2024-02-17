import { EntityManager } from '@mikro-orm/postgresql';
import { container } from '@sapphire/pieces';
import { Time } from '@sapphire/time-utilities';

import { StatsEntity, StatsPeriod } from '#base/entities/stats.entity';
import { UserEntity } from '#base/entities/user.entity';

export class StatsService {
  private static _instance: StatsService;

  static get Instance() {
    if (!this._instance) {
      const orm = container.orm.em.fork();
      this._instance = new StatsService(orm);
    }
    return this._instance;
  }

  constructor(readonly database: EntityManager) {}

  get(guild_id: string, period: StatsPeriod) {
    return this.database.find(StatsEntity, { guild_id, period });
  }

  getAllByPeriod(period: StatsPeriod) {
    return this.database.find(StatsEntity, { period });
  }

  async getByUser(user_id: string, guild_id: string, period: StatsPeriod) {
    let stats = await this.database.findOne(StatsEntity, {
      guild_id,
      period,
      user_id,
    });
    if (!stats) {
      stats = this.database.create(StatsEntity, {
        user_id,
        guild_id,
        period,
      });
    }

    return stats;
  }

  async getNewRegs(guild_id: string, period: StatsPeriod) {
    const days = this.getDaysPeriod(period);
    console.log(period, days);

    const date = new Date();
    date.setTime(date.getTime() - Time.Day * days);

    return this.database.find(UserEntity, {
      guild_id,
      first_join: {
        $gte: date,
      },
    });
  }

  async mergeStats(from: StatsEntity[], to: StatsPeriod) {
    for (const stat of from) {
      const toStat = await this.getByUser(stat.user_id, stat.guild_id, to);

      toStat.chat += stat.chat;
      toStat.voice += stat.voice;
      toStat.reactions += stat.reactions;

      this.database.persist(toStat);
    }

    await this.database.flush();
  }

  private getDaysPeriod(period: StatsPeriod) {
    switch (period) {
      case StatsPeriod.Day:
        return 1;
      case StatsPeriod.Week:
        return 7;
      case StatsPeriod.Month: {
        const date = new Date();
        return new Date(date.getFullYear(), date.getMonth(), 0).getDate();
      }
    }
  }
}
