import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

import './config';

import { RgdClient } from '#lib/rgd.client';

async function bootstrap() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [new ProfilingIntegration()],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });

  const client = new RgdClient();

  await client.login(process.env.BOT_TOKEN);
  client.setActivity('Поднимает геймдев с колен');
}

bootstrap().catch(console.error);
