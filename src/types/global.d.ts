import { MikroORM } from '@mikro-orm/postgresql';

import { RgdClient } from '#lib/rgd.client';

declare module '@sapphire/pieces' {
  interface Container {
    client: RgdClient;
    locale: Locale;
    orm: MikroORM;
  }

  export interface StoreRegistryEntries {
    shop: RgdShopStore;
  }
}
