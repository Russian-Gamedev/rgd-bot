import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

import { BaseEntity } from '#common/entities/base.entity';

export enum GuildSettings {
  AuditLogChannel = 'audit_log_channel',
  EventMessageChannel = 'event_message_channel',
}

@Entity({ tableName: 'guild_settings' })
export class GuildSettingsEntity<T> extends BaseEntity {
  @PrimaryKey()
  id: number;

  @Property({ type: 'bigint' })
  guild_id: bigint;

  @Property()
  key: string;

  @Property({ type: 'jsonb' })
  value: T;
}
