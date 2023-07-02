import 'reflect-metadata';
import * as dotenv from 'dotenv';
import '@sapphire/plugin-logger';
import { RgdClient } from './lib/RgdClient';

dotenv.config();

async function bootstrap() {
  const client = new RgdClient();

  try {
    const token = process.env.BOT_TOKEN;
    await client.login(token);
    client.setActivity('Поднимает геймдев с колен');
  } catch (e) {
    console.error(e);
    process.exit(0);
  }
}

bootstrap();
