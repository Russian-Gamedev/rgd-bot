import { Property } from '@mikro-orm/core';

export abstract class BaseEntity {
  @Property({ defaultRaw: 'now()' })
  createdAt = new Date();

  @Property({
    onUpdate: () => new Date(),
    defaultRaw: 'now()',
  })
  updatedAt = new Date();
}
