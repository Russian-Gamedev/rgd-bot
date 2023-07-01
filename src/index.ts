import 'reflect-metadata';
import * as dotenv from 'dotenv';
import '@sapphire/plugin-logger';
import { RgdClient } from '@/lib/RgdClient';
import { container } from '@sapphire/pieces';
import { Directus } from '@/lib/directus';

dotenv.config();

async function bootstrap() {
  const client = new RgdClient();

  try {
    container.directus = new Directus(
      process.env.DIRECTUS_URL,
      process.env.DIRECTUS_TOKEN,
    );

    const profile = await container.directus.me();
    console.log(profile);
    client.logger.info(`Directus logged as '${profile.first_name}'`);

    const token = process.env.BOT_TOKEN;

    await client.login(token);
    client.setActivity('Поднимает геймдев с колен');
  } catch (e) {
    console.error(e);
    process.exit(0);
  }
}

bootstrap();
