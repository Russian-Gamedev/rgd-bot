import { ApplyOptions } from '@sapphire/decorators';
import { SlashCommandSubcommandBuilder } from 'discord.js';

import { ShopItem } from '@/lib/shop/shop-item';

@ApplyOptions<ShopItem.Options>({
  cost: 500,
  name: 'статус',
  description: 'Сменить статус боту',
})
export class StatusShopItem extends ShopItem {
  run(payload: any) {
    console.log(payload);
  }

  commandBuilder(
    subcommandGroup: SlashCommandSubcommandBuilder,
  ): SlashCommandSubcommandBuilder {
    return subcommandGroup.setName(this.name).setDescription(this.description);
  }
}
