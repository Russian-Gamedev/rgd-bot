import { BooleanOption, StringOption } from 'necord';

import { GuildEvents } from '#config/guilds';

export class FakeEventDto {
  @StringOption({
    name: 'event',
    required: true,
    description: 'The event to trigger',
    choices: Object.values(GuildEvents).map((event) => ({
      name: event,
      value: event,
    })),
  })
  event: GuildEvents;

  @BooleanOption({
    name: 'silent',
    required: false,
    description: 'Whether to send the event message silently',
  })
  silent: boolean;
}
