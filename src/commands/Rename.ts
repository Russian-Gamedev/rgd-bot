import { ApplyOptions } from '@sapphire/decorators';
import {
  CommandOptions,
  CommandOptionsRunTypeEnum,
  ChatInputCommand,
  Command,
} from '@sapphire/framework';
import { BaseCommand } from '../lib/sapphire/base-command';

@ApplyOptions<CommandOptions>({
  description: 'Rename user or voice',
  runIn: [CommandOptionsRunTypeEnum.GuildText],
})
export class RenameCommand extends BaseCommand {
  override registerApplicationCommands(registry: ChatInputCommand.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) =>
          option
            .setName('user')
            .setDescription('Пользователя которого нужно переименовать'),
        )
        .addStringOption((option) =>
          option.setName('new-nick').setDescription('и будет зваться...'),
        ),
    );
  }

  public override async chatInputRun(
    interaction: Command.ChatInputInteraction,
  ) {
    const user = await interaction.options.getUser('user', true);
    const nickname = interaction.options.getString('new-nick', true);

    const member = await this.container.rgd.members.fetch(user.id);

    const prevNickname = member.nickname || member.user.username;

    member.setNickname(nickname, interaction.user.username + ' renamed');

    return interaction.reply({
      content: `**${prevNickname}** теперь **${nickname}**`,
    });
  }
}
