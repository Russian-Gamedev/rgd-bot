import { container, Events, Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import type { MessageReaction, User } from 'discord.js';
import { RoleBindings } from '../lib/services/entities/Discord';

@ApplyOptions<Listener.Options>({ event: Events.MessageReactionAdd })
export class ReactionsAdd extends Listener<typeof Events.MessageReactionAdd> {
  async run(reaction: MessageReaction, user: User) {
    if (user.bot) return;
    const emoji = reaction.emoji.id || reaction.emoji.name;
    const exist = RoleBindings.list.find(
      (bind) => bind.message == reaction.message.id && bind.emoji === emoji,
    );
    if (exist) {
      const member = await container.rgd.members.fetch(user.id);
      await member.roles.add(exist.role);
    }
  }
}
