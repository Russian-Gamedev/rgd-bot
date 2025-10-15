import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { Exclude, Expose } from 'class-transformer';

import { BaseEntity } from '#common/entities/base.entity';

@Entity({ tableName: 'bots' })
export class BotEntity extends BaseEntity {
  @PrimaryKey()
  id: number;

  @Property({ unique: true })
  name: string;

  @Property({ type: 'bigint' })
  ownerId: bigint;

  @Property({ type: 'array', default: [] })
  scopes: string[];

  @Property()
  @Exclude()
  tokenHash: string;

  @Property({ type: 'time with time zone', nullable: true, default: null })
  lastUsedAt?: Date;
}
