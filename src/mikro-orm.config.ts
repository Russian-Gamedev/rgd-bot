import { Migrator } from '@mikro-orm/migrations';
import { defineConfig, PostgreSqlDriver } from '@mikro-orm/postgresql';

import { Environment } from '#config/env';

const migrationPath = './src/migrations';

export default defineConfig({
  clientUrl: process.env.POSTGRES_URL,
  entities: ['./**/entities/*.entity.ts'],
  entitiesTs: ['./**/entities/*.entity.ts'],
  extensions: [Migrator],
  driver: PostgreSqlDriver,
  debug: process.env.NODE_ENV === Environment.Development,
  allowGlobalContext: true,
  migrations: {
    tableName: 'mikro_orm_migrations',
    path: migrationPath,
    transactional: true,
    disableForeignKeys: true,
    allOrNothing: true,
    emit: 'ts',
  },
});
