/* eslint-disable @typescript-eslint/no-var-requires */

require('dotenv').config();

const fs = require('fs');
const readlineSync = require('readline-sync');

const migrationsPath = './src/lib/orm/migrations';

const descriptionFileName = (timestamp) => {
  const DELIMITER = '-';
  const filesInDir = fs.readdirSync(migrationsPath);
  let counter = 0;

  for (const lastFileName of filesInDir) {
    if (!lastFileName) break;
    if (lastFileName[0] === '.') continue; // skipping sqlite json file

    counter = parseInt(lastFileName.split(DELIMITER)[0], 10) + 1;

    if (Number.isNaN(counter)) {
      counter = 0;
    }
    break;
  }

  let name = '';
  while (!name) {
    name = readlineSync
      .question(
        "\nWhat does this migration do? (Keep it short, it's going in the file name)\n> ",
      )
      .replace(/[^\w\s]/gi, '') // Remove any non-alphanumeric or whitespace characters
      .replace(/\s+/gi, DELIMITER) // Replace any number of whitespace characters with the delimiter
      .toLowerCase();
  }
  return `${counter.toString().padStart(4, '0')}-${name}-${timestamp}`;
};

module.exports = {
  entities: ['./dist/lib/orm/entities/**/*.js'], // path to our JS entities (dist), relative to `baseDir`
  entitiesTs: ['./src/lib/orm/entities/**/*.ts'], // path to our TS entities (src), relative to `baseDir`
  dbName: 'rgd-store.sqlite',
  type: 'sqlite',
  baseDir: process.cwd(),
  migrations: {
    tableName: 'mikro_orm_migrations', // migrations table name
    path: `./dist/lib/orm/migrations`, // path to folder with migration files
    pathTs: migrationsPath, // path to folder with migration files
    pattern: /^[\w-]+\d+\.js$/, // how to match migration files
    transactional: true, // run each migration inside transaction
    disableForeignKeys: false, // try to disable foreign_key_checks (or equivalent)
    allOrNothing: true, // run all migrations in current batch in master transaction
    emit: 'ts', // migration generation mode,
    fileName: descriptionFileName,
  },
};
