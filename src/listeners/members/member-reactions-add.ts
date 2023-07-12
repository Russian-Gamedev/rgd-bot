import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { Events, MessageReaction, User as DiscordUser } from 'discord.js';

import { RoleBindings } from '@/lib/database/entities';
import { RgdEvents } from '@/lib/discord/custom-events';

@ApplyOptions<Listener.Options>({
  event: Events.MessageReactionAdd,
})
export class ReactionsAdd extends Listener<typeof Events.MessageReactionAdd> {
  async run(reaction: MessageReaction, user: DiscordUser) {
    if (user.bot) return;
    try {
      const member = await this.container.rgd.members.fetch(user);
      const emoji = reaction.emoji.id || reaction.emoji.name;

      const rb = RoleBindings.cache.get(
        reaction.message.channelId,
        reaction.message.id,
        emoji,
      );
      if (rb) {
        await member.roles.add(rb.role);
        return;
      }

      this.container.client.emit(RgdEvents.ReactionAdd, reaction, member);
    } catch (e) {
      this.container.logger.error(e);
    }
  }
}
