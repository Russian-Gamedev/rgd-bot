import { Injectable, UseInterceptors } from '@nestjs/common';
import { EmbedBuilder, InteractionContextType, MessageFlags } from 'discord.js';
import {
  Context,
  createCommandGroupDecorator,
  Options,
  type SlashCommandContext,
  Subcommand,
} from 'necord';

import { UserService } from '#core/users/users.service';

import { ItemEntity, ItemRarity } from '../entities/item.entity';
import { ItemsService } from '../items.service';

import {
  TransferItemAutocompleteInterceptor,
  TransferItemDto,
} from './items.autocomplete';
import { CreateItemDto, ItemCostMap, ItemListDto } from './items.dto';

const ItemGroupDecorator = createCommandGroupDecorator({
  name: 'item',
  description: 'Commands related to items',
  contexts: [InteractionContextType.Guild],
});

@ItemGroupDecorator()
@Injectable()
export class ItemsCommands {
  constructor(
    private readonly itemsService: ItemsService,
    private readonly userService: UserService,
  ) {}

  @Subcommand({
    name: 'list',
    description: 'List all your items in this server',
  })
  async listItems(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: ItemListDto,
  ) {
    const guildID = interaction.guildId!;
    const userID = dto.user ? dto.user.id : interaction.user.id;

    const items = await this.itemsService.getItems(guildID, userID);

    if (items.length === 0) {
      return interaction.reply({
        content: `<@${userID}> не имеет предметов.`,
        flags: MessageFlags.SuppressNotifications,
      });
    }

    const embeds = items.slice(0, 10).map((item) => this.embedItem(item));

    return interaction.reply({
      content: `Предметы пользователя <@${userID}>:`,
      embeds,
      flags: MessageFlags.SuppressNotifications,
    });
  }

  @Subcommand({
    name: 'create',
    description: 'Создать новый предмет',
  })
  async createItem(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: CreateItemDto,
  ) {
    const cost = ItemCostMap[dto.rare ?? ItemRarity.COMMON];

    const guild_id = interaction.guildId;
    if (!guild_id) return null;

    const user_id = interaction.user.id;
    const user = await this.userService.findOrCreate(guild_id, user_id);
    if (user.coins < cost) {
      return interaction.reply({
        content: `У вас недостаточно монет. Создание предмета стоит ${cost.toLocaleString('ru-RU')} монет.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    if (dto.color && !/^#([0-9A-F]{6}|[0-9A-F]{3})$/i.test(dto.color)) {
      return interaction.reply({
        content: 'Пожалуйста, введите допустимый HEX цвет.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const target_user = dto.user ? dto.user.id : interaction.user.id;

    const newItem = await this.itemsService.createItem({
      guild_id,
      user_id: target_user,
      name: dto.name,
      description: dto.description,
      color: dto.color,
      image: dto.image,
      rare: dto.rare ?? ItemRarity.COMMON,
      transferable: dto.transferable ?? true,
    });
    await this.userService.addCoins(user, -cost);

    return interaction.reply({
      content: `Предмет **${newItem.name}** успешно создан и выдан <@${target_user}>!`,
      embeds: [this.embedItem(newItem)],
    });
  }

  private embedItem(item: ItemEntity): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setTitle(item.name)
      .setDescription(item.description || 'Нет описания')
      .setColor(item.color)
      .addFields(
        { name: 'Редкость', value: item.rare, inline: true },
        {
          name: 'Передаваемый',
          value: item.transferable ? 'Да' : 'Нет',
          inline: true,
        },
      );

    if (item.image) {
      embed.setImage(item.image);
    }

    return embed;
  }

  @UseInterceptors(TransferItemAutocompleteInterceptor)
  @Subcommand({
    name: 'transfer',
    description: 'Передать предмет другому пользователю',
  })
  async transferItem(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: TransferItemDto,
  ) {
    const guild_id = interaction.guildId;
    if (!guild_id) return;
    const user_id = interaction.user.id;

    const item = await this.itemsService.getItemById(parseInt(dto.id, 10));

    if (!item) {
      return interaction.reply({
        content: 'Предмет не найден.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (
      String(item.guild_id) !== guild_id ||
      String(item.user_id) !== user_id
    ) {
      return interaction.reply({
        content: 'Предмет не найден в вашем инвентаре.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (item.transferable === false) {
      return interaction.reply({
        content: 'Этот предмет нельзя передавать.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const target = dto.target.id;

    await this.itemsService.transferItem(item, target);

    return interaction.reply({
      content: `Вы успешно передали предмет **${item.name}** <@${target}>!`,
    });
  }
}
