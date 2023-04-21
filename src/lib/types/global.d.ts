import { Guild, TextChannel } from 'discord.js';
import type { DirectusApi } from '@/lib/directus/directus-orm';

declare module '@sapphire/pieces' {
  interface Container {
    rgd: Guild;
    mainChannel: TextChannel;
    debugChannel: TextChannel;
    api: DirectusApi;
  }
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      BOT_TOKEN: string;
      BOT_CLIENT_ID: string;
      DIRECTUS_TOKEN: string;
      DISCORD_LOGGER_WEBHOOK: string;
    }
  }
}
