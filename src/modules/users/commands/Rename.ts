import { ApplyOptions } from '@sapphire/decorators';
import {
  type CommandOptions,
  CommandOptionsRunTypeEnum,
  type ChatInputCommand,
} from '@sapphire/framework';
import type { ChatInputCommandInteraction } from 'discord.js';
import { replyWithError } from '@/lib/helpers/sapphire';
import { BaseCommand } from '@/lib/sapphire/base-command';

const OPTIONS = {
  USER: 'user',
  NEW_NAME: 'new_name',
};

@ApplyOptions<CommandOptions>({
  description: 'Переименовать юзера',
  runIn: [CommandOptionsRunTypeEnum.GuildText],
  name: 'rn',
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
            .setDescription('Пользователь, которого нужно переименовать')
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
    const user = interaction.options.getUser(OPTIONS.USER, true);
    const newName = interaction.options.getString(OPTIONS.NEW_NAME, true);

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

    return replyWithError(interaction, 'Пользователь не был указан');
  }
}
