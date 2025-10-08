import { AutocompleteInteraction } from 'discord.js';
import { AutocompleteInterceptor } from 'necord';
import { GuildSettings } from '../entities/guild-settings.entity';

export class SettingsAutoCompleteInterceptor extends AutocompleteInterceptor {
  override transformOptions(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused(true);

    let choices: string[] = [];

    if (focused.name === 'key') {
      Object.values(GuildSettings).forEach((setting) => {
        choices.push(setting);
      });
    }

    interaction.respond(
      choices
        .filter((choice) => choice.startsWith(focused.value))
        .map((choice) => ({ name: choice, value: choice })),
    );
  }
}
