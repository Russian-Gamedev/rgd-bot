import { container } from '@sapphire/pieces';

import { RgdShopStore } from './rgd-shop-store';
import { ShopItem } from './shop-item';

export class RgdShop {
  /**
   * The utilities this store holds.
   * @since 1.0.0
   */
  public readonly store: RgdShopStore;

  /**
   * @since 1.0.0
   * @param options The options for this server
   */
  public constructor() {
    container['RgdShop'] = this;
    this.store = new RgdShopStore();
  }

  public exposePiece(name: string, piece: ShopItem) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore Bypass TypeScript check for dynamic property assignment
    this[name] = piece;
  }
}

declare module '@sapphire/pieces' {
  interface StoreRegistryEntries {
    RgdShop: RgdShopStore;
  }

  interface Container {
    RgdShop: RgdShop;
  }
}
