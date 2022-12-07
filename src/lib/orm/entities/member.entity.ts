import { BaseEntity } from './base.entity';
import { Entity, Property } from '@mikro-orm/core';

@Entity({ tableName: 'members' })
export class Member extends BaseEntity {
  @Property({ index: true, type: 'varchar(64)' })
  userId: string;

  @Property({ onCreate: () => new Date(), type: 'text' })
  firstJoin: Date;

  @Property({ default: 0, unsigned: true, type: 'number' })
  reputation: number;

  @Property({ default: 0, unsigned: true, type: 'number' })
  experience: number;

  @Property({ default: 0, unsigned: true, type: 'number' })
  balance: number;

  @Property({ default: 0, unsigned: true, type: 'number' })
  leaveCounter: number;

  @Property({ nullable: true, type: 'string' })
  about?: string;

  @Property({ nullable: true, type: 'text' })
  birthDate?: Date;
}
