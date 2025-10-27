import { Injectable } from '@nestjs/common';
import { AutocompleteInteraction, GuildMember } from 'discord.js';
import { AutocompleteInterceptor, MemberOption, StringOption } from 'necord';

import { ItemsService } from '../items.service';

export class TransferItemDto {
  @StringOption({
    name: 'item',
    description: 'Предмет',
    required: true,
    autocomplete: true,
  })
  id: string;

  @MemberOption({
    name: 'target',
    description: 'Кому передать предмет',
    required: true,
  })
  target: GuildMember;
}

@Injectable()
export class TransferItemAutocompleteInterceptor extends AutocompleteInterceptor {
  constructor(private readonly itemsService: ItemsService) {
    super();
  }

  async transformOptions(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused(true);

    const choices: { value: string; name: string }[] = [];

    const guild_id = interaction.guildId!;
    const user_id = interaction.user.id;

    if (!guild_id) return;

    if (focused.name === 'item') {
      const items = await this.itemsService.getItems(guild_id, user_id);
      for (const item of items) {
        if (!item.transferable) continue;
        choices.push({
          value: item.id.toString(),
          name: `${item.name} (Редкость: ${item.rare})`,
        });
      }
    }

    return interaction.respond(choices);
  }
}
