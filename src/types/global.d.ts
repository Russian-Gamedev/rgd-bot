import { MikroORM } from '@mikro-orm/postgresql';
import { RedisClientType } from 'redis';

import { RgdClient } from '#lib/rgd.client';

declare module '@sapphire/pieces' {
  interface Container {
    client: RgdClient;
    locale: Locale;
    orm: MikroORM;
    redis: RedisClientType;
  }

  export interface StoreRegistryEntries {
    shop: RgdShopStore;
  }
}
