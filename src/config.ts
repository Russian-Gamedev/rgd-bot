import * as dotenv from 'dotenv';
import fs from 'fs';

import 'reflect-metadata';
import '@sapphire/plugin-scheduled-tasks';
import '@sapphire/plugin-scheduled-tasks/register';
import '@sapphire/plugin-api';
import '@sapphire/plugin-api/register';
import '@sapphire/plugin-logger';
import '@sapphire/plugin-logger/register';

process.env.NODE_ENV ??= 'development';

const envFile = `.${process.env.NODE_ENV}.env`;

if (fs.existsSync(envFile)) {
  dotenv.config({
    path: envFile,
  });
  console.log(`Local ${envFile} loaded`);
}
