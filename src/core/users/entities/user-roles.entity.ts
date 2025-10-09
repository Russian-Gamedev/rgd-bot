import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity({ tableName: 'user_roles' })
export class UserRoleEntity {
  @PrimaryKey({ type: 'uuid', defaultRaw: 'uuidv7()' })
  id: string;

  @Property({ type: 'bigint', index: true })
  guild_id: bigint;

  @Property({ type: 'bigint', index: true })
  user_id: bigint;

  @Property({ type: 'bigint' })
  role_id: bigint;
}
