import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { Events, MessageReaction, User as DiscordUser } from 'discord.js';

import { SERVER_ID } from '#configs/constants';
import { RoleBindings } from '#lib/database/entities';
import { RgdEvents } from '#lib/discord/custom-events';

@ApplyOptions<Listener.Options>({
  event: Events.MessageReactionRemove,
})
export class ReactionsRemove extends Listener<
  typeof Events.MessageReactionRemove
> {
  async run(reaction: MessageReaction, user: DiscordUser) {
    if (reaction.message.guildId != SERVER_ID) return;
    if (user.bot) return;

    const member = await this.container.rgd.members.fetch(user);
    const emoji = reaction.emoji.id || reaction.emoji.name;

    const rb = RoleBindings.cache.get(
      reaction.message.channelId,
      reaction.message.id,
      emoji,
    );
    if (rb) {
      await member.roles.remove(rb.role);
      return;
    }

    this.container.client.emit(RgdEvents.ReactionRemove, reaction, member);
  }
}
