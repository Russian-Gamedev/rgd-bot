import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';

import { Events, type MessageReaction, type User } from 'discord.js';

import { ReactionsService } from '@/core/statistics/reactions';

@ApplyOptions<Listener.Options>({ event: Events.MessageReactionAdd })
export class ReactionsAdd extends Listener<typeof Events.MessageReactionAdd> {
  async run(reaction: MessageReaction, user: User) {
    await ReactionsService.instance.addReaction(reaction, user);
  }
}
