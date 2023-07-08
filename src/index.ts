import { container } from '@sapphire/pieces';

import './config';

import { RgdClient } from './lib/rgd-client';

async function bootstrap() {
  const client = new RgdClient();

  try {
    const token = process.env.BOT_TOKEN;
    await client.login(token);
    client.setActivity('Поднимает геймдев с колен');
  } catch (e) {
    container.logger.error(e);
    process.exit(0);
  }
}

bootstrap().catch((error) => container.logger.error(error));
