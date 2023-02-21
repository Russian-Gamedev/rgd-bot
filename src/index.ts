import { SERVER_ID } from './configs/discord-constants';
import * as dotenv from 'dotenv';
import '@sapphire/plugin-logger';
import { Logger, LogLevel, SapphireClient } from '@sapphire/framework';
import { ActivityType, GatewayIntentBits, Partials } from 'discord.js';
import { DirectusApi } from './lib/directus/directus-orm';

dotenv.config();

async function bootstrap() {
  const client = new SapphireClient({
    presence: {
      status: 'online',
      activities: [
        {
          type: ActivityType.Playing,
          name: 'Поднимает геймдев с колен',
          url: 'https://rgd.chat',
        },
      ],
    },
    logger: {
      instance: new Logger(LogLevel.Debug),
    },
    disableMentionPrefix: true,
    loadMessageCommandListeners: true,
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildPresences,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.GuildInvites,
      GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Channel, Partials.Message, Partials.Reaction],
  });

  try {
    const token = process.env.BOT_TOKEN;
    const profile = await DirectusApi.instance.login(
      process.env.DIRECTUS_TOKEN,
    );
    client.logger.info(`Directus logged as '${profile.first_name}'`);

    await client.login(token);
  } catch (e) {
    console.error(e);
    process.exit(0);
  }
}

bootstrap();
