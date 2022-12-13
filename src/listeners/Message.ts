import { Events, Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import type { Message } from 'discord.js';
import { User } from '../lib/services/entities/User';
import { StatsDay } from '../lib/services/entities/Stats';

@ApplyOptions<Listener.Options>({ event: Events.MessageCreate })
export class MemberLeave extends Listener<typeof Events.MessageCreate> {
  async run(message: Message) {
    const words = message.content.split(' ').filter((e) => e.length);

    if (words.length) {
      const user = await User.findOne(message.member.id);
      if (user) {
        user.experience += words.length;
        await user.save();

        let dayStats = await StatsDay.findOne('', {
          filter: {
            user: message.member.id,
          },
        });

        if (!dayStats) {
          dayStats = await StatsDay.create({
            user: message.member.id,
          });
        }

        dayStats.chat += words.length;

        await dayStats.save();
      }
    }
  }
}
