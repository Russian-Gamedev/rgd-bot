import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { type HexColorString } from 'discord.js';

import { BaseEntity } from '#common/entities/base.entity';
import { type DiscordID } from '#root/lib/types';

@Entity({ tableName: 'items' })
export class ItemEntity extends BaseEntity {
  @PrimaryKey()
  id: number;

  @Property({ type: 'bigint' })
  user_id: DiscordID;

  @Property()
  name: string;

  @Property()
  description: string;

  @Property({ type: 'varchar', length: 7 })
  color: HexColorString;

  @Property({ nullable: true })
  image: string | null;

  @Property()
  rare: string;

  @Property()
  transferable: boolean;

  @Property({ type: 'jsonb', default: [], defaultRaw: "'[]'" })
  transferHistory: { from: DiscordID; to: DiscordID; date: Date }[] = [];
}

export enum ItemRarity {
  COMMON = 'обычный',
  UNCOMMON = 'необычный',
  RARE = 'редкий',
  EPIC = 'эпический',
  LEGENDARY = 'легендарный',
}
