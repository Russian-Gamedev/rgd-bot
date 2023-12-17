import { Guild, TextChannel } from 'discord.js';

import { Locale } from '@/locale';

import { ClydeBot } from '#lib/clyde-bot';
import { RgdClient } from '#lib/rgd-client';
import { RgdShopStore } from '#lib/shop/rgd-shop-store';

declare module '@sapphire/pieces' {
  interface Container {
    client: RgdClient;
    rgd: Guild;
    mainChannel: TextChannel;
    debugChannel: TextChannel;
    locale: Locale;
    clyde: ClydeBot;
  }

  export interface StoreRegistryEntries {
    shop: RgdShopStore;
  }
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'local';

      BOT_TOKEN: string;
      BOT_CLIENT_ID: string;

      DISCORD_LOGGER_WEBHOOK: string;
    }
  }
}
