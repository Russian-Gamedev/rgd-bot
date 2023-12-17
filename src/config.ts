import * as dotenv from 'dotenv';
import fs from 'fs';

import 'reflect-metadata';
import '@sapphire/plugin-scheduled-tasks/register';
import '@sapphire/plugin-api/register';

const isLocal = process.env.NODE_ENV === 'local';

if (isLocal) {
  const envFile = `.${process.env.NODE_ENV}.env`;

  if (!fs.existsSync(envFile)) {
    throw new Error(`File '.${process.env.NODE_ENV}.env' is not found`);
  }

  dotenv.config({
    path: envFile,
  });
}

console.debug(process.env);
