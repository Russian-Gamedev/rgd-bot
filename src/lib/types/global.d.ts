import { Guild, TextChannel } from 'discord.js';

declare module '@sapphire/pieces' {
  interface Container {
    rgd: Guild;
    mainChannel: TextChannel;
    debugChannel: TextChannel;
    directus: Directus;
  }
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';

      BOT_TOKEN: string;
      BOT_CLIENT_ID: string;

      DISCORD_LOGGER_WEBHOOK: string;
    }
  }
}
