import { AutocompleteInteraction } from 'discord.js';
import { AutocompleteInterceptor } from 'necord';

import { GuildSettings } from '#config/guild-settings';

export class SettingsAutoCompleteInterceptor extends AutocompleteInterceptor {
  override async transformOptions(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused(true);

    const choices: string[] = [];

    if (focused.name === 'key') {
      Object.values(GuildSettings).forEach((setting) => {
        choices.push(setting);
      });
    }

    await interaction.respond(
      choices
        .filter((choice) => choice.startsWith(focused.value))
        .map((choice) => ({ name: choice, value: choice })),
    );
  }
}
