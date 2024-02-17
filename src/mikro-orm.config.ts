import { Migrator } from '@mikro-orm/migrations';
import { defineConfig } from '@mikro-orm/postgresql';
import { resolve } from 'path';

import './config';

import { IS_DEV } from '#config/constants';

const migrationsPath = './src/lib/orm/migrations';

export default defineConfig({
  entities: ['./build/entities/*.entity.js'],
  entitiesTs: ['./src/entities/*.entity.ts'],
  dbName: process.env.POSTGRES_DB,
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  debug: IS_DEV,
  baseDir: resolve(),
  extensions: [Migrator],
  migrations: {
    tableName: 'mikro_orm_migrations',
    path: migrationsPath.replace('src', 'build'),
    pathTs: migrationsPath,
    transactional: true,
    disableForeignKeys: false,
    allOrNothing: true,
    emit: 'ts',
  },
});
