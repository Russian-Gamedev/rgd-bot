import { Injectable } from '@nestjs/common';
import { AutocompleteInteraction, Channel, Client } from 'discord.js';
import { AutocompleteInterceptor } from 'necord';

import { PortalsService } from '../portals.service';

@Injectable()
export class DeletePortalAutocompleteInterceptor extends AutocompleteInterceptor {
  constructor(
    private readonly portalsService: PortalsService,
    private readonly client: Client,
  ) {
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

    const channelNames = await this.resolveChannelNames(matchingPortals);

    for (const portal of matchingPortals) {
      const nameA = channelNames.get(portal.channel_a_id.toString());
      const nameB = channelNames.get(portal.channel_b_id.toString());
      const name = `${nameA ?? `#${portal.channel_a_id}`} ↔ ${nameB ?? `#${portal.channel_b_id}`} (ID: ${portal.id})`;
      if (query && !name.toLowerCase().includes(query)) continue;
      choices.push({ name, value: portal.id.toString() });
    }

    return interaction.respond(choices.slice(0, 25));
  }

  private async resolveChannelNames(
    portals: { channel_a_id: bigint; channel_b_id: bigint }[],
  ): Promise<Map<string, string>> {
    const channelIds = new Set<string>();
    for (const portal of portals) {
      channelIds.add(portal.channel_a_id.toString());
      channelIds.add(portal.channel_b_id.toString());
    }

    const results = new Map<string, string>();

    await Promise.allSettled(
      [...channelIds].map(async (id) => {
        try {
          const channel = (await this.client.channels.fetch(id, {
            force: false,
          })) as Channel | null;
          if (channel && 'name' in channel) {
            results.set(id, `#${(channel as { name: string }).name}`);
          }
        } catch {
          // channel not accessible, use ID fallback
        }
      }),
    );

    return results;
  }
}
