import { ApplyOptions } from '@sapphire/decorators';
import {
  ApplicationCommandRegistry,
  CommandOptionsRunTypeEnum,
} from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { ChatInputCommandInteraction } from 'discord.js';

import { EmojiCoin } from '#configs/emojies';

@ApplyOptions<Subcommand.Options>({
  name: 'shop',
  description: 'Товары в магазине за игровую валюту на сервере',
  subcommands: [
    { name: 'list', chatInputRun: 'chatInputList' },
    { name: 'buy', chatInputRun: 'chatInputBuy' },
  ],
  runIn: CommandOptionsRunTypeEnum.GuildText,
})
export class ShopListCommand extends Subcommand {
  override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .addSubcommand((subcommand) =>
            subcommand.setName('list').setDescription('список всех товаров'),
          )
          .addSubcommandGroup((group) => {
            group.setName('buy').setDescription('купить что-то');

            const items = this.container.RgdShop.store.values();

            for (const item of items) {
              group.addSubcommand((builder) => item.commandBuilder(builder));
            }

            return group;
          }),
      { idHints: ['1131944283717521449'] },
    );
  }

  async chatInputList(interaction: ChatInputCommandInteraction) {
    const shop = this.container.RgdShop.store.values();

    let text = 'Весь ассортимент товаров:\n';

    for (const item of shop) {
      text += `* \`${item.name}\` (${item.cost}${EmojiCoin.Top}): ${item.description}\n`;
    }

    await interaction.reply(text);
  }
}
