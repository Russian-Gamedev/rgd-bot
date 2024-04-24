import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';

import { BotEvents } from '#config/constants';
import { BaseEntity } from '#lib/orm/BaseEntity';

@Entity({ tableName: 'bot_events' })
@Index({ properties: ['guild_id', 'type'] })
export class BotEventsEntity extends BaseEntity {
  @PrimaryKey()
  id: number;

  @Property()
  guild_id: string;

  @Property()
  type: BotEvents;

  @Property({ type: 'text' })
  message: string;

  @Property({ type: 'text', nullable: true, default: null })
  attachment: string | null;

  @Property({ default: 0 })
  triggered_count: number;
}
