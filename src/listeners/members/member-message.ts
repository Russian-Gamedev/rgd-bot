import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { Events, Message } from 'discord.js';

import { StatsDay, User } from '@/lib/database/entities';

@ApplyOptions<Listener.Options>({
  event: Events.MessageCreate,
})
export class MemberMessage extends Listener<typeof Events.MessageCreate> {
  async run(message: Message) {
    if (message.member.user.bot) return;

    const words = message.content.split(' ').filter((e) => e.length);
    if (words.length === 0) return;

    const user = await User.ensure(message.member);

    user.experience += words.length;

    await user.save();

    const stats = await StatsDay.ensure(user.id);
    stats.chat += words.length;

    await stats.save();
  }
}
