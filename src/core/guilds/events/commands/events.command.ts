import { Injectable } from '@nestjs/common';
import {
  InteractionContextType,
  MessageFlags,
  SendableChannels,
} from 'discord.js';
import {
  Context,
  createCommandGroupDecorator,
  Options,
  type SlashCommandContext,
  Subcommand,
} from 'necord';

import { cast } from '#root/lib/utils';

import { GuildEventService } from '../guild-events.service';

import { FakeEventDto } from './events.dto';

const EventsGroupDecorator = createCommandGroupDecorator({
  name: 'events',
  description: 'Commands related to events',
  contexts: [InteractionContextType.Guild],
  defaultMemberPermissions: 'Administrator',
});

@Injectable()
@EventsGroupDecorator()
export class GuildEventsCommands {
  constructor(private readonly guildEventService: GuildEventService) {}

  @Subcommand({
    name: 'fake',
    description: 'Trigger a fake event (for testing purposes)',
  })
  async fakeEvent(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: FakeEventDto,
  ) {
    const event = await this.guildEventService.getRandom(
      interaction.guild!.id,
      dto.event,
      { user: `<@${interaction.user.id}>` },
    );
    const silent = Boolean(dto.silent);

    if (!event) {
      await interaction.reply({
        content: 'No event templates found for this event.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    if (silent) {
      await cast<SendableChannels>(interaction.channel).send(event);
      await interaction.reply({
        content: 'Event triggered silently.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await interaction.reply(event);
  }
}
