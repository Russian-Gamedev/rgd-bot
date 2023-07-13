import { ApplyOptions } from '@sapphire/decorators';
import {
  ChatInputCommand,
  Command,
  CommandOptions,
  CommandOptionsRunTypeEnum,
} from '@sapphire/framework';
import { ChannelType, ChatInputCommandInteraction } from 'discord.js';

import { ROLE_IDS } from '@/configs/constants';
import { replyWithError } from '@/lib/helpers/sapphire';

const OPTIONS = {
  CHANNEL: 'channel',
  NEW_NAME: 'new_name',
};

@ApplyOptions<CommandOptions>({
  description: 'Переименовать голосовой канал',
  runIn: [CommandOptionsRunTypeEnum.GuildText],
  name: 'rnv',
})
export class RenameVoiceCommand extends Command {
  override registerApplicationCommands(registry: ChatInputCommand.Registry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .addChannelOption((option) =>
            option
              .setName(OPTIONS.CHANNEL)
              .setDescription('Голосовой канал, который нужно переименовать')
              .addChannelTypes(ChannelType.GuildVoice)
              .setRequired(true),
          )
          .addStringOption((option) =>
            option
              .setName(OPTIONS.NEW_NAME)
              .setDescription('Новое имя')
              .setRequired(true),
          ),
      { idHints: ['1077462157941297172'] },
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel(OPTIONS.CHANNEL, true);
    const newName = interaction.options.getString(OPTIONS.NEW_NAME, true);
    const member = await this.container.rgd.members.fetch(interaction.user.id);
    if (!member.roles.cache.has(ROLE_IDS.ACTIVE)) {
      return replyWithError(interaction, 'Вы не можете переименовать канал.');
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

    return replyWithError(interaction, 'Канал не был указан');
  }
}
