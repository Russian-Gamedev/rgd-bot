import { ApplyOptions } from '@sapphire/decorators';
import { EmojiRegex } from '@sapphire/discord-utilities';
import {
  ApplicationCommandRegistry,
  CommandOptionsRunTypeEnum,
} from '@sapphire/framework';
import { Subcommand } from '@sapphire/plugin-subcommands';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageActionRowComponentBuilder,
  PermissionFlagsBits,
  TextBasedChannel,
} from 'discord.js';

import { EmojiNumber } from '#base/config/emojies';
import { replyWithError } from '#base/lib/sapphire';
import { ReactionsService } from '#base/services/reactions.service';

@ApplyOptions<Subcommand.Options>({
  name: 'role-reactions',
  description: 'Работа с выдачей ролей по реакции',
  subcommands: [
    {
      name: 'set',
      chatInputRun: 'chatInputSet',
    },
    {
      name: 'remove',
      chatInputRun: 'chatInputRemove',
    },
  ],
  runIn: CommandOptionsRunTypeEnum.GuildText,
})
export class RoleReactionCommand extends Subcommand {
  override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand((subcommand) =>
          subcommand
            .setName('set')
            .setDescription('Добавить или обновить сообщение с ролями')
            .addStringOption((input) =>
              input
                .setName('message')
                .setDescription('ссылка на сообщение')
                .setRequired(true),
            ),
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName('remove')
            .setDescription('Удалить привязку ролей у сообщение')
            .addStringOption((input) =>
              input
                .setName('message')
                .setDescription('ссылка на сообщение')
                .setRequired(true),
            ),
        ),
    );
  }

  async chatInputSet(interaction: Subcommand.ChatInputCommandInteraction) {
    const messageLink = interaction.options.getString('message', true);
    const [channel_id, message_id] = messageLink.split('/').slice(-2);

    const channel = (await interaction.guild.channels.fetch(
      channel_id,
    )) as TextBasedChannel;
    const message = await channel.messages.fetch(message_id);

    const roles = {} as Record<string, string>;

    if (message.mentions.roles.size === 1) {
      const mention = message.mentions.roles.at(0);
      const [emoji] = message.content.match(/<a?:\w{2,32}:\d{17,20}>/);
      roles[emoji] = mention.id;
    } else {
      const parsedRoles = this.parseMessage(message.content);
      Object.assign(roles, parsedRoles);
    }

    if (Object.keys(roles).length === 0) {
      return replyWithError(
        interaction,
        'Сообщение не содержит правильный шаблон',
      );
    }

    let text = `Сообщение: ${messageLink}\n`;
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

    await ReactionsService.Instance.deleteRolesReaction(
      interaction.guild.id,
      channel_id,
      message_id,
    );

    const emojiRoles = [] as [string, string][];

    for (const [emoji, role] of Object.entries(roles)) {
      emojiRoles.push([
        role,
        EmojiRegex.test(emoji) ? EmojiRegex.exec(emoji).groups.id : emoji,
      ]);
    }

    await ReactionsService.Instance.addRolesReaction(
      interaction.guild.id,
      channel_id,
      message_id,
      emojiRoles,
    );

    await response.deleteReply();

    return interaction.editReply({
      content: 'Сохранено!',
      components: [],
    });
  }

  async chatInputRemove(interaction: Subcommand.ChatInputCommandInteraction) {
    const messageLink = interaction.options.getString('message', true);
    const [channel_id, message_id] = messageLink.split('/').slice(-2);

    const channel = (await interaction.guild.channels.fetch(
      channel_id,
    )) as TextBasedChannel;
    const message = await channel.messages.fetch(message_id);
    if (!message) {
      return replyWithError(interaction, 'Сообщение не найдено');
    }

    await ReactionsService.Instance.deleteRolesReaction(
      interaction.guild.id,
      channel_id,
      message_id,
    );

    for (const reactions of message.reactions.cache.values()) {
      await reactions.users.remove(this.container.client.id);
    }

    return interaction.reply({ content: 'Удалено!', ephemeral: true });
  }

  private parseMessage(content: string) {
    const roles: Record<string, string> = {};

    /*
      Find in text: emoji - role mention

      1. @GameMaker
      OR
      <web:111111111> @WebDeveloper

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
