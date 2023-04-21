import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { Events, type Message } from 'discord.js';
import { StatsDay } from '@/lib/directus/directus-entities/Stats';
import { User } from '@/lib/directus/directus-entities/User';
import { FilterRule } from '@/lib/directus/directus-orm/filters';

@ApplyOptions<Listener.Options>({ event: Events.MessageCreate })
export class MemberLeave extends Listener<typeof Events.MessageCreate> {
  async run(message: Message) {
    if (message.member.user.bot) return;

    const words = message.content.split(' ').filter((e) => e.length);
    const member = await message.member.user.fetch();

    if (words.length) {
      const user = await User.findOne(member.id);
      if (user) {
        user.experience += words.length;
        user.avatar = member.displayAvatarURL({ extension: 'webp' });
        user.banner = member.bannerURL({ extension: 'webp' });

        await user.save();

        let dayStats = await StatsDay.findOne('', {
          filter: new FilterRule().EqualTo('user', member.id),
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
