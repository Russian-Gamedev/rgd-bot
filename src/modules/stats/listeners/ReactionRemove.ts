import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';

import { Events, type MessageReaction, type User } from 'discord.js';

import { ReactionsService } from '@/core/statistics/reactions';

@ApplyOptions<Listener.Options>({ event: Events.MessageReactionRemove })
export class ReactionsAdd extends Listener<
  typeof Events.MessageReactionRemove
> {
  async run(reaction: MessageReaction, user: User) {
    await ReactionsService.instance.removeReaction(reaction, user);
  }
}
