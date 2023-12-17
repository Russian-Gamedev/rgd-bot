import * as dotenv from 'dotenv';
import fs from 'fs';

import 'reflect-metadata';
import '@sapphire/plugin-scheduled-tasks/register';
import '@sapphire/plugin-api/register';

const isLocal = process.env.NODE_ENV === 'local';

if (isLocal) {
  const envFile = `.env`;

  if (!fs.existsSync(envFile)) {
    throw new Error(`File '.env' is not found`);
  }

  dotenv.config({
    path: envFile,
  });
}
