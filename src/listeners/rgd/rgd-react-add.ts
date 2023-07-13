import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { Time } from '@sapphire/time-utilities';
import { GuildMember, MessageReaction } from 'discord.js';

import { getEmojiWeight } from '@/configs/emoji-weight';
import { StatsDay } from '@/lib/database/entities';
import { RgdEvents } from '@/lib/discord/custom-events';
import { messageUserReactionCount } from '@/lib/helpers/utils';

@ApplyOptions<Listener.Options>({
  event: RgdEvents.ReactionAdd,
})
export class RgdReactAdd extends Listener {
  async run(reaction: MessageReaction, member: GuildMember) {
    const message = await reaction.message.fetch();
    if (message.author.id === member.id) return;
    const diffTime = Date.now() - message.createdAt.getTime();
    if (diffTime > Time.Day) return;
    const emojisCount = await messageUserReactionCount(message, member);
    if (emojisCount > 1) return;

    const reactionWeight = getEmojiWeight(reaction.emoji);

    const stats = await StatsDay.ensure(message.author.id);
    stats.reactions += reactionWeight;
    await stats.save();
  }
}
