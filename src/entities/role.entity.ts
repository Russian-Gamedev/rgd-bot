import { Entity, Index, PrimaryKey, Property } from '@mikro-orm/core';

import { BaseEntity } from '#lib/orm/BaseEntity';

@Entity({ tableName: 'guild_roles' })
@Index({ properties: ['guild_id', 'role_id'] })
export class RoleEntity extends BaseEntity {
  @PrimaryKey()
  id: number;

  @Property()
  guild_id: string;

  @Property()
  role_id: string;

  @Property()
  name: string;

  @Property()
  color: string;

  @Property()
  position: number;
}
