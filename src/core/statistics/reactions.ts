import { Message, MessageReaction, User } from 'discord.js';
import { RoleBindings } from '@/lib/directus/directus-entities/Discord';
import { container } from '@sapphire/pieces';
import { Time } from '@sapphire/time-utilities';
import { StatsDay } from '@/lib/directus/directus-entities/Stats';
import { FilterRule } from '@/lib/directus/directus-orm/filters';
import { EmojiWeight } from '@/configs/emoji-weight';

export class ReactionsService {
  static instance = new ReactionsService();

  async addReaction(reaction: MessageReaction, user: User) {
    const isGuard = await this.guard(reaction, user, 2);
    if (!isGuard) return;

    const dayStats = await this.ensureStatsDay(user);
    const emoji = reaction.emoji.id || reaction.emoji.name;
    const reactionWeight = EmojiWeight[emoji] ?? 1;

    dayStats.reactions += reactionWeight;

    await dayStats.save();
  }
  async removeReaction(reaction: MessageReaction, user: User) {
    const isGuard = await this.guard(reaction, user, 1);
    if (!isGuard) return;

    const dayStats = await this.ensureStatsDay(user);
    const emoji = reaction.emoji.id || reaction.emoji.name;
    const reactionWeight = EmojiWeight[emoji] ?? 1;

    dayStats.reactions -= reactionWeight;

    await dayStats.save();
  }

  private async guard(
    reaction: MessageReaction,
    user: User,
    reactionCount: number,
  ) {
    const message = await reaction.message.fetch();
    const isBinding = await this.roleBinding(reaction, user);
    if (isBinding) return false;

    if (message.author.id === user.id || user.bot) return false;

    if (this.isOutdated(message)) return false;
    return (await this.messageHasUserReaction(message, user)) < reactionCount;
  }

  private async messageHasUserReaction(message: Message, user: User) {
    let count = 0;

    for (const react of message.reactions.cache.values()) {
      const reactUsers = await react.users.fetch();
      count += +reactUsers.has(user.id);
    }

    return count;
  }

  private async ensureStatsDay(user: User) {
    let dayStats = await StatsDay.findOne('', {
      filter: new FilterRule().EqualTo('user', user.id),
    });

    if (!dayStats) {
      dayStats = await StatsDay.create({
        user: user.id,
      });
    }

    return dayStats;
  }

  private isOutdated(message: Message) {
    const diffTime = Date.now() - message.createdAt.getTime();
    return diffTime > Time.Day;
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
