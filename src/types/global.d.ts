import { Guild, TextChannel } from 'discord.js';

import { ClydeBot } from '@/lib/clyde-bot';
import { RgdClient } from '@/lib/rgd-client';
import { Locale } from '@/locale';

declare module '@sapphire/pieces' {
  interface Container {
    client: RgdClient;
    rgd: Guild;
    mainChannel: TextChannel;
    debugChannel: TextChannel;
    locale: Locale;
    clyde: ClydeBot;
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
