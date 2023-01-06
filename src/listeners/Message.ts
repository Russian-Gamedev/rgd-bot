import { Events, Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import type { Message } from 'discord.js';
import { User } from '../lib/services/entities/User';
import { StatsDay } from '../lib/services/entities/Stats';

@ApplyOptions<Listener.Options>({ event: Events.MessageCreate })
export class MemberLeave extends Listener<typeof Events.MessageCreate> {
  async run(message: Message) {
    if (message.member.user.bot) return;

    const words = message.content.split(' ').filter((e) => e.length);
    const member = await message.member.fetch();

    if (words.length) {
      const user = await User.findOne(member.id);
      if (user) {
        user.experience += words.length;
        user.avatar = member.displayAvatarURL({ format: 'jpg' });
        user.banner = member.user.bannerURL({ format: 'jpg' });

        await user.save();

        let dayStats = await StatsDay.findOne('', {
          filter: {
            user: member.id,
          },
        });

        if (!dayStats) {
          dayStats = await StatsDay.create({
            user: member.id,
          });
        }

        dayStats.chat += words.length;

        await dayStats.save();
      }
    }
  }
}
