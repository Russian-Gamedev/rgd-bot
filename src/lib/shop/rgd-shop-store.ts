import { Store } from '@sapphire/framework';

import { ShopItem } from './shop-item';

export class RgdShopStore extends Store<ShopItem> {
  public constructor() {
    super(ShopItem, { name: 'shop' });
  }
}
