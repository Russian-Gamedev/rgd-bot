import { Entity, Property } from '@mikro-orm/core';

@Entity({ abstract: true })
export abstract class BaseEntity {
  @Property({
    fieldName: 'created_at',
    type: 'timestamptz',
    defaultRaw: 'now()',
  })
  createdAt = new Date();

  @Property({
    fieldName: 'updated_at',
    type: 'timestamptz',
    defaultRaw: 'now()',
    onUpdate: () => new Date(),
  })
  updatedAt = new Date();
}
