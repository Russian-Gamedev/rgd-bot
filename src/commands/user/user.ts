import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import { ChatInputCommandInteraction } from 'discord.js';

import { User } from '@/lib/database/entities';
import { replyJson } from '@/lib/helpers/sapphire';

const enum Options {
  User = 'user',
}

@ApplyOptions({
  name: 'user',
  description: 'Информация о себе/пользователе',
})
export class UserCommand extends Command {
  override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .addUserOption((input) =>
            input
              .setName(Options.User)
              .setDescription('Другой пользователь')
              .setRequired(false),
          ),
      { idHints: ['1127244254356455435'] },
    );
  }

  override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const target =
      interaction.options.getUser(Options.User, false) ?? interaction.user;
    const user = await User.ensure(target.id);

    console.log(user);

    return replyJson(interaction, user);
  }
}
