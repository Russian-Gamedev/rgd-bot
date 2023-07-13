import { ApplyOptions } from '@sapphire/decorators';
import { EmojiRegex } from '@sapphire/discord-utilities';
import {
  ApplicationCommandRegistry,
  CommandOptionsRunTypeEnum,
} from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { cast } from '@sapphire/utilities';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ComponentType,
  MessageActionRowComponentBuilder,
  PermissionFlagsBits,
  TextBasedChannel,
} from 'discord.js';

import { SERVER_ID } from '@/configs/constants';
import { EmojiNumber } from '@/configs/emojies';
import { RoleBindings } from '@/lib/database/entities/';
import { replyWithError } from '@/lib/helpers/sapphire';
import { messageLink, messageLinkRaw } from '@/lib/utils';

@ApplyOptions<Subcommand.Options>({
  name: 'role-binding',
  description: 'Работа с выдачей ролей по реакции',
  subcommands: [
    { name: 'list', chatInputRun: 'chatInputList' },
    { name: 'set', chatInputRun: 'chatInputSet' },
    { name: 'remove', chatInputRun: 'chatInputRemove' },
  ],
  runIn: CommandOptionsRunTypeEnum.GuildText,
})
export class RoleBindingCommand extends Subcommand {
  override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
          .addSubcommand((subcommandGroup) =>
            subcommandGroup
              .setName('list')
              .setDescription('список уже привязанных сообщений'),
          )
          .addSubcommand((subcommandGroup) =>
            subcommandGroup
              .setName('set')
              .setDescription('Добавить или обновить сообщение с ролями')
              .addStringOption((input) =>
                input
                  .setName('message')
                  .setDescription('id сообщения с ролями')
                  .setRequired(true),
              )
              .addChannelOption((input) =>
                input
                  .setName('channel')
                  .setDescription('Канал в котором сообщение')
                  .addChannelTypes(ChannelType.GuildText),
              ),
          )
          .addSubcommand((subcommandGroup) =>
            subcommandGroup
              .setName('remove')
              .setDescription('Удалить привязку ролей у сообщения')
              .addStringOption((input) =>
                input
                  .setName('message')
                  .setDescription('id сообщения с ролями')
                  .setRequired(true),
              )
              .addChannelOption((input) =>
                input
                  .setName('channel')
                  .setDescription('Канал в котором сообщение')
                  .addChannelTypes(ChannelType.GuildText),
              ),
          ),
      { idHints: ['1128712465493008557'] },
    );
  }

  async chatInputList(interaction: Subcommand.ChatInputCommandInteraction) {
    if (interaction.guildId != SERVER_ID) return;
    const list = await RoleBindings.find();

    const group: Record<string, number> = {};

    for (const rb of list) {
      const key = `${rb.channel}-${rb.message}`;
      if (group[key] === undefined) {
        group[key] = 0;
      }
      group[key]++;
    }

    let text = 'Список всех сообщений с ролями:\n';

    for (const [key, count] of Object.entries(group)) {
      const [channel, message] = key.split('-');

      const link = messageLinkRaw(interaction.guildId, channel, message);

      text += `* ${link} \`${count}\`\n`;
    }

    await interaction.reply({
      content: text,
      ephemeral: true,
    });
  }

  async chatInputSet(interaction: Subcommand.ChatInputCommandInteraction) {
    if (interaction.guildId != SERVER_ID) return;
    const messageId = interaction.options.getString('message', true);
    const channel = cast<TextBasedChannel>(
      interaction.options.getChannel('channel', false) ?? interaction.channel,
    );
    try {
      const message = await channel.messages.fetch(messageId);

      const roles = this.parseMessage(message.content);

      if (Object.keys(roles).length === 0) {
        return replyWithError(
          interaction,
          'Сообщение не содержит правильный шаблон',
        );
      }

      let text = `Сообщение: ${messageLink(message)}\n`;
      text += `Правильно ли определены эмоджи и роли?\n\n`;

      for (const [emoji, role_id] of Object.entries(roles)) {
        text += `${emoji} = <@&${role_id}>\n`;
      }

      const row = new ActionRowBuilder<MessageActionRowComponentBuilder>();

      row.addComponents(
        new ButtonBuilder()
          .setCustomId('rb-confirm')
          .setStyle(ButtonStyle.Success)
          .setLabel('Сохранить'),
        new ButtonBuilder()
          .setCustomId('rb-cancel')
          .setStyle(ButtonStyle.Danger)
          .setLabel('Отменить'),
      );

      const reply = await interaction.reply({
        content: text,
        components: [row],
        ephemeral: true,
        fetchReply: true,
      });
      const response = await reply.awaitMessageComponent({
        componentType: ComponentType.Button,
      });
      if (response.customId === 'rb-cancel') {
        return interaction.deleteReply();
      }

      await response.deferReply({ ephemeral: true });

      for (const emoji of Object.keys(roles)) {
        await message.react(emoji);
      }

      await RoleBindings.delete({
        channel: message.channelId,
        message: message.id,
      });

      for (const [emoji, role] of Object.entries(roles)) {
        const rb = RoleBindings.create({
          emoji: EmojiRegex.test(emoji)
            ? EmojiRegex.exec(emoji).groups.id
            : emoji,
          role,
          message: message.id,
          channel: message.channelId,
        });
        await rb.save();
      }

      await RoleBindings.cache.load();

      await response.deleteReply();

      return interaction.editReply({
        content: 'Сохранено!',
        components: [],
      });
    } catch (e) {
      if (e instanceof Error) {
        return replyWithError(interaction, e.message);
      }
      this.container.logger.warn(e);
    }
  }

  async chatInputRemove(
    interaction: Subcommand.ChatInputCommandInteraction,
  ): Promise<any> {
    if (interaction.guildId != SERVER_ID) return;
    const messageId = interaction.options.getString('message', true);
    const channel = cast<TextBasedChannel>(
      interaction.options.getChannel('channel', false) ?? interaction.channel,
    );
    try {
      const message = await channel.messages.fetch(messageId);
      if (!message) {
        return replyWithError(interaction, 'Сообщение не найдено');
      }
      await RoleBindings.delete({ channel: channel.id, message: messageId });
      await RoleBindings.cache.load();

      for (const reactions of message.reactions.cache.values()) {
        await reactions.users.remove(this.container.client.id);
      }

      return interaction.reply({ content: 'Удаленно!', ephemeral: true });
    } catch (e) {
      if (e instanceof Error) {
        return replyWithError(interaction, e.message);
      }
      this.container.logger.warn(e);
    }
  }

  private parseMessage(content: string) {
    const roles: Record<string, string> = {};

    /*
      Find in text: emoji - role mention

      1. @GameMaker
      OR
      <web:111111111> - @WebDeveloper

     */

    const bindingsRegex =
      /(?<emoji>.\.|<a?:\w{2,32}:\d{17,20}>) <@&(?<role_id>\d{17,20})>/g;

    const matches = content.matchAll(bindingsRegex);

    for (const match of matches) {
      let emoji = match.groups.emoji;
      const role_id = match.groups.role_id;

      if (!EmojiRegex.test(emoji)) {
        emoji = emoji.replace('.', '');
        if (/^\d$/g.test(emoji)) {
          emoji = EmojiNumber[emoji];
        }
      }
      roles[emoji] = role_id;
    }

    return roles;
  }
}
