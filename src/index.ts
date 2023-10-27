import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

import './config';

import { RgdClient } from './lib/rgd-client';

async function bootstrap() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [new ProfilingIntegration()],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });

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
