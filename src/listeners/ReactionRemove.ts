import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { container } from '@sapphire/pieces';
import { Events, type MessageReaction, type User } from 'discord.js';
import { RoleBindings } from '../lib/directus/directus-entities/Discord';

@ApplyOptions<Listener.Options>({ event: Events.MessageReactionRemove })
export class ReactionsAdd extends Listener<
  typeof Events.MessageReactionRemove
> {
  async run(reaction: MessageReaction, user: User) {
    if (user.bot) return;
    const emoji = reaction.emoji.id || reaction.emoji.toString();
    const exist = RoleBindings.list.find((bind) => {
      return bind.message == reaction.message.id && bind.emoji === emoji;
    });
    if (exist) {
      const member = await container.rgd.members.fetch(user.id);
      await member.roles.remove(exist.role);
    }
  }
}
