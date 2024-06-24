import { RgdClient } from '#lib/rgd.client';

import './config';

async function bootstrap() {
  const client = new RgdClient();

  await client.login(process.env.BOT_TOKEN);
  client.setActivity('Поднимает геймдев с колен');
}

bootstrap().catch(console.error);
