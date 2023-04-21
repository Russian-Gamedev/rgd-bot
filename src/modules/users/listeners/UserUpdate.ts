import { Events, Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import type { User as DiscordUser } from 'discord.js';
import { User } from '@/lib/directus/directus-entities/User';

@ApplyOptions<Listener.Options>({ event: Events.UserUpdate })
export class UserUpdate extends Listener<typeof Events.UserUpdate> {
  async run(_oldMember: DiscordUser, newMember: DiscordUser) {
    const member = await newMember.fetch();
    const user = await User.findOne(newMember.id);
    if (!user) return;

    user.username = member.username;
    user.avatar = member.displayAvatarURL({ extension: 'webp' });
    user.banner = member.bannerURL({ extension: 'webp' });
    await user.save();
  }
}
