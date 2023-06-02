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
import { ROLE_IDS } from '@/configs/discord-constants';

const OPTIONS = {
  User: 'user',
  Text: 'text',
};

@ApplyOptions<CommandOptions>({
  description: 'Донести досье на человека',
  runIn: [CommandOptionsRunTypeEnum.GuildText],
})
export class LoreEditCommand extends BaseCommand {
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
        )
        .addStringOption((option) =>
          option
            .setName(OPTIONS.Text)
            .setDescription('Досье')
            .setRequired(true),
        ),
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser(OPTIONS.User, true);
    const text = interaction.options.getString(OPTIONS.Text, true);

    const member = await this.container.rgd.members.fetch(user.id);

    if (!member.roles.cache.has(ROLE_IDS.ADVISER)) {
      return interaction.reply({ content: 'Вы не советник', ephemeral: true });
    }

    try {
      const _user = await User.findOne(user.id);

      _user.lore = text;

      await _user.save();

      return interaction.reply(`**${user.username}** - ` + text);
    } catch (e: any) {
      return replyWithError(interaction, e.message);
    }
  }
}
