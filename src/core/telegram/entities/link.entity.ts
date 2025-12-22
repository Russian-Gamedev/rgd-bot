import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

import { BaseEntity } from '#common/entities/base.entity';

@Entity({ tableName: 'telegram_links' })
export class TelegramLinkEntity extends BaseEntity {
  @PrimaryKey()
  id: number;

  @Property({ type: 'bigint', unique: true })
  discord_id: bigint;

  @Property({ type: 'bigint', unique: true })
  telegram_id: bigint;
}
