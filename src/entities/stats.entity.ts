import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

import { BaseEntity } from '#lib/orm/BaseEntity';

export const enum StatsPeriod {
  Day = 'day',
  Week = 'week',
  Month = 'month',
}

@Entity({ tableName: 'stats' })
export class StatsEntity extends BaseEntity {
  @PrimaryKey()
  id: number;

  @Property()
  user_id: string;

  @Property()
  voice: number = 0;

  @Property()
  chat: number = 0;

  @Property()
  reactions: number = 0;

  @Property()
  period: StatsPeriod;
}
