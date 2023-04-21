import { ApplyOptions } from '@sapphire/decorators';
import {
  type CommandOptions,
  CommandOptionsRunTypeEnum,
  type ChatInputCommand,
} from '@sapphire/framework';
import { ChannelType, ChatInputCommandInteraction } from 'discord.js';
import { replyWithError } from '@/lib/helpers/sapphire';
import { BaseCommand } from '@/lib/sapphire/base-command';

const OPTIONS = {
  CHANNEL: 'channel',
  NEW_NAME: 'new_name',
};

@ApplyOptions<CommandOptions>({
  description: 'Переименовать голосовой канал',
  runIn: [CommandOptionsRunTypeEnum.GuildText],
  name: 'rnv',
})
export class RenameVoiceCommand extends BaseCommand {
  override registerApplicationCommands(registry: ChatInputCommand.Registry) {
    registry.registerChatInputCommand((builder) =>
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
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const channel = interaction.options.getChannel(OPTIONS.CHANNEL, true);
    const newName = interaction.options.getString(OPTIONS.NEW_NAME, true);

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
