import { ApplyOptions } from '@sapphire/decorators';
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptionsRunTypeEnum,
} from '@sapphire/framework';
import { container } from '@sapphire/pieces';
import { ChatInputCommandInteraction } from 'discord.js';

import { SERVER_ID } from '@/configs/constants';
import locale from '@/locale';

@ApplyOptions({
  name: 'help',
  description: 'Помощь по всем командам',
  runIn: [CommandOptionsRunTypeEnum.GuildText],
})
export class Help extends Command {
  override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand(
      (builder) => builder.setName(this.name).setDescription(this.description),
      { idHints: ['1127244252297040036'] },
    );
  }

  override async chatInputRun(interaction: ChatInputCommandInteraction) {
    if (interaction.guildId != SERVER_ID) return;
    const commands = container.client.stores.get('commands');

    const categories: Record<string, Command[]> = {};

    for (const command of commands.values()) {
      const category = command.category ?? 'public';

      if (!(category in categories)) {
        categories[category] = [];
      }

      categories[category].push(command);
    }

    let content = '# Список всех команд #\n';
    const categoryObj = locale.main.commands.categories;
    type CategoryKeys = keyof typeof categoryObj;

    for (const [category, commands] of Object.entries(categories)) {
      const categoryName = categoryObj[category as CategoryKeys] ?? category;
      content += `## ${categoryName} ##\n`;

      for (const command of commands) {
        const id = command.applicationCommandRegistry.globalCommandId;
        if (!id) continue;
        if ('subcommands' in command.options) {
          content += `\n**${command.description}**\n`;
          for (const subcommand of command.options.subcommands as Array<{
            name: string;
          }>) {
            content += `</${command.name} ${subcommand.name}:${id}>\n`;
          }
        } else {
          content += `</${command.name}:${id}> ${command.description}\n`;
        }
      }
    }

    await interaction.reply({
      content,
      ephemeral: true,
    });
  }
}