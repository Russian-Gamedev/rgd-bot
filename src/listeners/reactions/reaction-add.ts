import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { Time } from '@sapphire/time-utilities';
import { MessageReaction, User } from 'discord.js';

import { StatsPeriod } from '#base/entities/stats.entity';
import { getUserReactionsCount } from '#base/lib/utils';
import { ReactionsService } from '#base/services/reactions.service';
import { StatsService } from '#base/services/stats.service';

@ApplyOptions<Listener.Options>({
  event: Events.MessageReactionAdd,
})
export class ReactionAdd extends Listener<typeof Events.MessageReactionAdd> {
  get reactionService() {
    return ReactionsService.Instance;
  }

  async run(reaction: MessageReaction, user: User) {
    if (user.bot) return;

    const member = await reaction.message.guild.members.fetch(user.id);
    const emoji = reaction.emoji.id || reaction.emoji.name;

    const roleReaction = await this.reactionService.getRole({
      guild_id: reaction.message.guild.id,
      channel_id: reaction.message.channelId,
      message_id: reaction.message.id,
      emoji,
    });

    if (roleReaction) {
      await member.roles.add(roleReaction.role_id);
      return;
    }

    await this.processReactionStats(reaction, user);
  }

  private async processReactionStats(reaction: MessageReaction, user: User) {
    const message = await reaction.message.fetch();
    if (message.author.id === user.id) return;
    const diffTime = Date.now() - message.createdAt.getTime();
    if (diffTime > Time.Day) return;

    const emojisCount = await getUserReactionsCount(message, user.id);
    if (emojisCount > 1) return;

    const emoji = reaction.emoji.id || reaction.emoji.name;

    const emojiWeight = await this.reactionService.getEmojiWeight(
      message.guild.id,
      emoji,
    );

    const stats = await StatsService.Instance.getByUser(
      message.guild.id,
      user.id,
      StatsPeriod.Day,
    );

    stats.reactions += emojiWeight;

    await StatsService.Instance.database.persistAndFlush(stats);
  }
}
