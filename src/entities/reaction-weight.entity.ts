import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';

import { BaseEntity } from '#base/lib/orm/BaseEntity';

@Entity({ tableName: 'emoji_weight' })
@Index({ properties: ['guild_id', 'emoji'] })
export class ReactionWeightEntity extends BaseEntity {
  @PrimaryKey()
  id: number;

  @Property()
  guild_id: string;

  @Property()
  emoji: string;

  @Property()
  weight: number;
}
