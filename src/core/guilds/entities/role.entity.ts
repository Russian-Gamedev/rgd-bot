import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

import { BaseEntity } from '#common/entities/base.entity';

@Entity({ tableName: 'roles' })
export class RoleEntity extends BaseEntity {
  @PrimaryKey()
  id: number;

  @Property({ type: 'bigint' })
  guild_id: bigint;

  @Property({ type: 'bigint' })
  role_id: bigint;

  @Property()
  name: string;

  @Property()
  color: string;

  @Property()
  position: number;
}
