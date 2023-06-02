import { replyWithError } from '@/lib/helpers/sapphire';
import { ApplyOptions } from '@sapphire/decorators';
import {
  type CommandOptions,
  CommandOptionsRunTypeEnum,
  type ChatInputCommand,
} from '@sapphire/framework';
import { ChatInputCommandInteraction } from 'discord.js';
import { BaseCommand } from '@/lib/sapphire/base-command';
import { User } from '@/lib/directus/directus-entities/User';

const OPTIONS = {
  User: 'user',
};

@ApplyOptions<CommandOptions>({
  description: 'Получить досье на человека',
  runIn: [CommandOptionsRunTypeEnum.GuildText],
})
export class LoreCommand extends BaseCommand {
  override registerApplicationCommands(registry: ChatInputCommand.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) =>
          option
            .setName(OPTIONS.User)
            .setDescription('Участник')
            .setRequired(true),
        ),
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser(OPTIONS.User, true);

    try {
      const _user = await User.findOne(user.id);

      if (_user.lore === ' ') {
        return interaction.reply(`На ${user.username} нет досье.`);
      }

      return interaction.reply(`**${user.username}** - ` + _user.lore);
    } catch (e: any) {
      return replyWithError(interaction, e.message);
    }
  }
}
