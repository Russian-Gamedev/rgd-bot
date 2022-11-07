import { SqliteDriver } from '@mikro-orm/sqlite';
import { MikroORM } from '@mikro-orm/core';

declare module '@sapphire/pieces' {
  interface Container {
    orm: MikroORM<SqliteDriver>;
  }
}
