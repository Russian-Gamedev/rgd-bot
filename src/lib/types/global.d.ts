import { Guild, TextChannel } from 'discord.js';
import { Directus } from '@/lib/directus';

declare module '@sapphire/pieces' {
  interface Container {
    rgd: Guild;
    mainChannel: TextChannel;
    debugChannel: TextChannel;
    directus: Directus;
  }
}

declare module '@directus/sdk/src/rest' {
  export type RestClient<T> = R<T>;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';

      BOT_TOKEN: string;
      BOT_CLIENT_ID: string;

      DIRECTUS_TOKEN: string;
      DIRECTUS_URL: string;

      DISCORD_LOGGER_WEBHOOK: string;
    }
  }
}
