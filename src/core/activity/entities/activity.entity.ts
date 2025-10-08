import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

import { BaseEntity } from '#common/entities/base.entity';

export const enum ActivityPeriod {
  Day = 'day',
  Week = 'week',
  Month = 'month',
}

@Entity({ tableName: 'activities' })
export class ActivityEntity extends BaseEntity {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'uuidv7()' })
  id: string;

  @Property({ type: 'bigint', index: 'activity_guild_user_period_idx' })
  guild_id: bigint;

  @Property({ type: 'bigint', index: 'activity_guild_user_period_idx' })
  user_id: bigint;

  @Property({ type: 'varchar', index: 'activity_guild_user_period_idx' })
  period: ActivityPeriod;

  @Property({ type: 'integer', defaultRaw: '0' })
  message: number;

  @Property({ type: 'integer', defaultRaw: '0' })
  voice: number;

  @Property({ type: 'integer', defaultRaw: '0' })
  reactions: number;
}
