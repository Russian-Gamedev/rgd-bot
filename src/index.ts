import * as dotenv from 'dotenv';

import {
  Logger,
  LogLevel,
  SapphireClient,
  container,
} from '@sapphire/framework';
import { MikroORM, SqliteDriver } from '@mikro-orm/sqlite';

import '@sapphire/plugin-logger';
import { API } from './lib/services/directus';

dotenv.config();

async function bootstrap() {
  const client = new SapphireClient({
    presence: {
      status: 'online',
      activities: [
        {
          type: 'STREAMING',
          name: 'Поднимает геймдев с колен',
        },
      ],
    },
    logger: {
      instance: new Logger(LogLevel.Debug),
    },
    disableMentionPrefix: true,
    loadMessageCommandListeners: true,
    intents: [
      'GUILDS',
      'GUILD_MEMBERS',
      'GUILD_MESSAGES',
      'GUILD_MESSAGE_REACTIONS',
      'MESSAGE_CONTENT',
      'GUILD_PRESENCES',
      'GUILD_VOICE_STATES',
      'GUILD_BANS',
    ],
    partials: ['CHANNEL', 'MESSAGE', 'REACTION'],
  });

  try {
    const token = process.env.BOT_TOKEN;

    await client.login(token);

    container.api = new API();

    const orm = await MikroORM.init<SqliteDriver>();

    container.orm = orm;
  } catch (e) {
    console.error(e);
    process.exit(0);
  }
}

bootstrap();
