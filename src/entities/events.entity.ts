import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

import { BotEvents } from '#config/constants';
import { BaseEntity } from '#lib/orm/BaseEntity';

@Entity({ tableName: 'bot_events' })
export class BotEventsEntity extends BaseEntity {
  @PrimaryKey()
  id: number;

  @Property()
  guild_id: string;

  @Property()
  type: BotEvents;

  @Property()
  message: string;

  @Property({ nullable: true, default: null })
  attachment: string | null;

  @Property({ default: 0 })
  triggered_count: number;
}
