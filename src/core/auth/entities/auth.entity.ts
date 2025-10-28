import { Entity, OneToOne, PrimaryKey, Property } from '@mikro-orm/core';

import { BaseEntity } from '#common/entities/base.entity';
import { UserEntity } from '#core/users/entities/user.entity';

@Entity({ tableName: 'auth' })
export class AuthEntity extends BaseEntity {
  @PrimaryKey()
  id: number;

  @Property({ type: 'bigint' })
  guild_id: bigint;

  @OneToOne(() => UserEntity, {
    owner: true,
    orphanRemoval: true,
    deleteRule: 'CASCADE',
    type: 'bigint',
  })
  user: UserEntity;
}
