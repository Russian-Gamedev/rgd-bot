import { BaseEntity } from './base.entity';
import { Entity, Property } from '@mikro-orm/core';

@Entity({ tableName: 'members' })
export class Member extends BaseEntity {
  @Property({ index: true, type: 'varchar(64)' })
  userId: string;

  @Property({ onCreate: () => new Date(), type: 'text' })
  firstJoin: Date;

  @Property({ default: 0, unsigned: true })
  reputation: number;

  @Property({ default: 0, unsigned: true })
  experience: number;

  @Property({ default: 0, unsigned: true })
  balance: number;

  @Property({ default: 0, unsigned: true })
  leaveCounter: number;

  @Property({ nullable: true })
  about?: string;

  @Property({ nullable: true })
  birthDate?: Date;
}
