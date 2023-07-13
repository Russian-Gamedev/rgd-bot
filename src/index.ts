import './config';

import { RgdClient } from './lib/rgd-client';

async function bootstrap() {
  const client = new RgdClient();

  try {
    const token = process.env.BOT_TOKEN;
    await client.login(token);
    client.setActivity('Поднимает геймдев с колен');
  } catch (e) {
    console.trace(e);
    process.exit(0);
  }
}

bootstrap().catch((error) => console.trace(error));
