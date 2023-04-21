import { ApplyOptions } from '@sapphire/decorators';
import {
  type CommandOptions,
  CommandOptionsRunTypeEnum,
  type ChatInputCommand,
} from '@sapphire/framework';
import { ChatInputCommandInteraction } from 'discord.js';
import { BaseCommand } from '@/lib/sapphire/base-command';

const OPTIONS = {
  USER: 'user',
};

@ApplyOptions<CommandOptions>({
  description: 'Получить аватарку',
  runIn: [CommandOptionsRunTypeEnum.GuildText],
  aliases: ['ava'],
})
export class AvatarCommand extends BaseCommand {
  override registerApplicationCommands(registry: ChatInputCommand.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) =>
          option
            .setName(OPTIONS.USER)
            .setDescription('Пользователь, которого нужно получить аву')
            .setRequired(true),
        ),
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const user = interaction.options.getUser(OPTIONS.USER, true);

    return interaction.reply({
      files: [user.avatarURL({ extension: 'webp', size: 4096 })],
    });
  }
}
