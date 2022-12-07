import { ApplyOptions } from '@sapphire/decorators';
import {
  CommandOptions,
  CommandOptionsRunTypeEnum,
  ChatInputCommand,
  Command,
} from '@sapphire/framework';
import { BaseCommand } from '../lib/sapphire/base-command';
import { replyWithError } from '../lib/helpers/sapphire';
import { ChannelType } from 'discord.js';

const OPTIONS = {
  USER: 'user',
  CHANNEL: 'channel',
  NEW_NAME: 'new-name',
};

@ApplyOptions<CommandOptions>({
  description: 'Переименовать юзера или голосовой канал',
  runIn: [CommandOptionsRunTypeEnum.GuildText],
  aliases: ['rn'],
})
export class RenameCommand extends BaseCommand {
  override registerApplicationCommands(registry: ChatInputCommand.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) =>
          option
            .setName(OPTIONS.USER)
            .setDescription('Пользователь, которого нужно переименовать'),
        )
        .addChannelOption((option) =>
          option
            .setName(OPTIONS.CHANNEL)
            .setDescription('Голосовой канал, который нужно переименовать'),
        )
        .addStringOption((option) =>
          option.setName(OPTIONS.NEW_NAME).setDescription('Новое имя'),
        ),
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputInteraction,
  ) {
    const user = interaction.options.getUser(OPTIONS.USER, false);
    const channel = interaction.options.get(OPTIONS.CHANNEL, false).channel;

    const newName = interaction.options.get(OPTIONS.NEW_NAME, true).message
      .content;

    if (user) {
      const member = await this.container.rgd.members.fetch(user.id);
      const prevNickname = member.nickname || member.user.username;

      try {
        await member.setNickname(
          newName,
          `${interaction.user.username} has renamed ${member.user.username}`,
        );
      } catch (e) {
        this.container.logger.error(e);

        return replyWithError(interaction, 'Не удается установить ник', true);
      }

      return interaction.reply({
        content: `Пользователь **${prevNickname}** был переименован в **${newName}**`,
      });
    }

    if (channel) {
      const voiceChannel = await this.container.rgd.channels.fetch(channel.id);
      const prevChannelName = channel.name;

      if (voiceChannel.type !== ChannelType.GuildVoice) {
        return replyWithError(
          interaction,
          'Переименовать возможно только голосовой канал',
        );
      }

      try {
        await voiceChannel.setName(newName, `${channel}`);
      } catch (e) {
        this.container.logger.error(e);

        return replyWithError(interaction, '', true);
      }

      return interaction.reply({
        content: `Голосовой канал **${prevChannelName}** был переименован в **${newName}**`,
      });
    }

    return replyWithError(
      interaction,
      'Ни канал ни пользователь не был указан',
    );
  }
}
