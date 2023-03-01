import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { container } from '@sapphire/pieces';
import { Events, type MessageReaction, type User } from 'discord.js';
import { StatsDay } from '../lib/directus/directus-entities/Stats';
import { FilterRule } from '../lib/directus/directus-orm/filters';
import { RoleBindings } from '../lib/directus/directus-entities/Discord';

@ApplyOptions<Listener.Options>({ event: Events.MessageReactionRemove })
export class ReactionsAdd extends Listener<
  typeof Events.MessageReactionRemove
> {
  async run(reaction: MessageReaction, user: User) {
    if (user.bot) return;
    const isRoleBinding = await this.roleBinding(reaction, user);
    if (!isRoleBinding) {
      let dayStats = await StatsDay.findOne('', {
        filter: new FilterRule().EqualTo('user', reaction.message.author.id),
      });

      if (!dayStats) {
        dayStats = await StatsDay.create({
          user: reaction.message.author.id,
        });
      }

      dayStats.reactions--;

      await dayStats.save();
    }
  }

  private async roleBinding(reaction: MessageReaction, user: User) {
    const emoji = reaction.emoji.id || reaction.emoji.toString();
    const exist = RoleBindings.list.find((bind) => {
      return bind.message == reaction.message.id && bind.emoji === emoji;
    });
    if (exist) {
      const member = await container.rgd.members.fetch(user.id);
      await member.roles.remove(exist.role);
      return true;
    }
    return false;
  }
}
