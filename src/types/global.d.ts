import { Guild, TextChannel } from 'discord.js';

import { RgdClient } from '@/lib/rgd-client';
import { Locale } from '@/locale';

declare module '@sapphire/pieces' {
  interface Container {
    client: RgdClient;
    rgd: Guild;
    mainChannel: TextChannel;
    debugChannel: TextChannel;
    locale: Locale;
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
