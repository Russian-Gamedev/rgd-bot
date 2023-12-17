import { container } from '@sapphire/pieces';
import { join } from 'path';
import { ConnectionOptions, DataSource } from 'typeorm';

import '#base/config';

export const DatabaseConfig: ConnectionOptions = {
  type: 'postgres',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT),
  username: process.env.DATABASE_USERNAME,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: [join(__dirname, 'entities/**/*Entity.ts')],
  applicationName: 'rgd-bot',
  synchronize: false,
};

export const databaseConnect = async () => {
  const db = new DataSource(DatabaseConfig);
  container.logger.info(
    `[DataBase] Try connect to ${DatabaseConfig.host}:${DatabaseConfig.port}`,
  );
  await db.initialize();
  container.logger.info('[DataBase] Connected!');

  const entities = db.entityMetadatas.map((entity) => entity.name);

  entities.forEach((entity, index) => {
    let line = index + 1 === entities.length ? '└─' : '├─';
    line += ` Loaded Entity[${entity}]`;

    container.logger.info('[DataBase]', line);
  });

  return;
};
