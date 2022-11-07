import { Entity, PrimaryKey, Property } from '@mikro-orm/core';
import { customNanoid } from 'lib/utilts';

@Entity({ abstract: true })
export abstract class BaseEntity {
  @PrimaryKey({ type: 'varchar(6)' })
  id = customNanoid(6);

  @Property({ type: 'text' })
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date(), type: 'text' })
  updatedAt: Date = new Date();

  @Property({
    nullable: true,
    type: 'text',
  })
  deletedAt: Date;
}
