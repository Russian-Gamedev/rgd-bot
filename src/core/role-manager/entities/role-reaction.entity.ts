import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/legacy';

@Entity({ tableName: 'role_reactions' })
export class RoleReactionEntity {
  @PrimaryKey()
  id: number;

  @Property({ type: 'bigint' })
  guild_id: bigint;

  @Property({ type: 'bigint' })
  role_id: bigint;

  @Property({ type: 'bigint' })
  message_id: bigint;

  @Property({ type: 'text' })
  emoji: string;
}
