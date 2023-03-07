import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { container } from '@sapphire/pieces';
import { Events, type MessageReaction, type User } from 'discord.js';
import { StatsDay } from '../lib/directus/directus-entities/Stats';
import { FilterRule } from '../lib/directus/directus-orm/filters';
import { RoleBindings } from '../lib/directus/directus-entities/Discord';
import { Time } from '../configs/time-constants';

@ApplyOptions<Listener.Options>({ event: Events.MessageReactionAdd })
export class ReactionsAdd extends Listener<typeof Events.MessageReactionAdd> {
  async run(reaction: MessageReaction, user: User) {
    if (user.bot) return;
    const isBinding = await this.roleBinding(reaction, user);
    if (!isBinding) {
      const message = await reaction.message.fetch();
      if (message.author.id === user.id) return;
      if (Date.now() - message.createdAt.getTime() > Time.Day) return;
      let dayStats = await StatsDay.findOne('', {
        filter: new FilterRule().EqualTo('user', message.author.id),
      });

      if (!dayStats) {
        dayStats = await StatsDay.create({
          user: message.author.id,
        });
      }

      dayStats.reactions++;

      await dayStats.save();
    }
  }

  private async roleBinding(reaction: MessageReaction, user: User) {
    const emoji = reaction.emoji.id || reaction.emoji.name;
    const exist = RoleBindings.list.find(
      (bind) => bind.message == reaction.message.id && bind.emoji === emoji,
    );
    if (exist) {
      const member = await container.rgd.members.fetch(user.id);
      await member.roles.add(exist.role);
      return true;
    }
    return false;
  }
}
