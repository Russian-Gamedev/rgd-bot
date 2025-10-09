import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

import { BaseEntity } from '#common/entities/base.entity';
import { GuildEvents } from '#config/guilds';

@Entity({ tableName: 'guild_events' })
export class GuildEventEntity extends BaseEntity {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'uuidv7()' })
  id: string;

  @Property({ type: 'bigint', index: true })
  guild_id: bigint;

  @Property({ type: 'varchar', index: true })
  event: GuildEvents;

  @Property({ type: 'text' })
  message: string;

  @Property({ type: 'array', nullable: true, default: null })
  attachments: string[] | null;

  @Property({ default: 0 })
  triggered_count: number;
}
