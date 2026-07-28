import { Injectable } from '@nestjs/common';
import { AutocompleteInteraction } from 'discord.js';
import { AutocompleteInterceptor } from 'necord';

import { PortalsService } from '../portals.service';

@Injectable()
export class DeletePortalAutocompleteInterceptor extends AutocompleteInterceptor {
  constructor(private readonly portalsService: PortalsService) {
    super();
  }

  async transformOptions(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused(true);
    if (focused.name !== 'id') {
      return interaction.respond([]);
    }

    const portals = await this.portalsService.listPortals();
    const currentChannelId = interaction.channelId;

    const query = focused.value.toLowerCase();
    const choices: { name: string; value: string }[] = [];

    const matchingPortals = portals.filter(
      (p) =>
        p.channel_a_id.toString() === currentChannelId ||
        p.channel_b_id.toString() === currentChannelId,
    );

    for (const portal of matchingPortals) {
      const name = `#${portal.channel_a_id} ↔ #${portal.channel_b_id} (ID: ${portal.id})`;
      if (query && !name.toLowerCase().includes(query)) continue;
      choices.push({ name, value: portal.id.toString() });
    }

    return interaction.respond(choices.slice(0, 25));
  }
}
