import { Entity, PrimaryKey } from '@mikro-orm/core';

import { BaseEntity } from '#common/entities/base.entity';

@Entity({ tableName: 'users' })
export class UserEntity extends BaseEntity {
  @PrimaryKey({ type: 'bigint' })
  id: bigint;
}
