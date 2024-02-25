import { MikroORM } from '@mikro-orm/postgresql';
import { Guild } from 'discord.js';
import { RedisClientType } from 'redis';

import { RgdClient } from '#lib/rgd.client';

declare module '@sapphire/pieces' {
  interface Container {
    client: RgdClient;
    locale: Locale;
    orm: MikroORM;
    redis: RedisClientType;

    rgd: Guild;
  }

  export interface StoreRegistryEntries {
    shop: RgdShopStore;
  }
}
