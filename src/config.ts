import * as dotenv from 'dotenv';
import fs from 'fs';

import 'reflect-metadata';
import '@sapphire/plugin-scheduled-tasks/register';
import '@sapphire/plugin-api/register';

process.env.NODE_ENV ??= 'development';

const envFile = `.${process.env.NODE_ENV}.env`;

if (!fs.existsSync(envFile)) {
  throw new Error(`File '${process.env.NODE_ENV}' not found`);
}

dotenv.config({
  path: envFile,
});
