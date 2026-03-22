import { ReflectMetadataProvider } from '@mikro-orm/decorators/legacy';
import { Migrator } from '@mikro-orm/migrations';
import { defineConfig, PostgreSqlDriver } from '@mikro-orm/postgresql';
import path from 'path';

const migrationPath = path.join(__dirname, './migrations');

export default defineConfig({
  metadataProvider: ReflectMetadataProvider,
  clientUrl: process.env.POSTGRES_URL,
  entities: ['./**/entities/*.entity.ts'],
  entitiesTs: ['./**/entities/*.entity.ts'],
  extensions: [Migrator],
  driver: PostgreSqlDriver,
  debug: process.env.DATABASE_QUERY_LOG == 'true',
  allowGlobalContext: true,
  migrations: {
    tableName: 'mikro_orm_migrations',
    path: migrationPath,
    transactional: true,
    disableForeignKeys: true,
    allOrNothing: true,
    emit: 'ts',
    snapshotName: 'snapshot',
  },
});
