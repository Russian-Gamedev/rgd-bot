import { Events, Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import type { User as DiscordUser } from 'discord.js';
import { User } from '../lib/services/entities/User';

@ApplyOptions<Listener.Options>({ event: Events.UserUpdate })
export class MemberBan extends Listener<typeof Events.UserUpdate> {
  async run(oldMember: DiscordUser, newMember: DiscordUser) {
    const isNewAvatar =
      oldMember.displayAvatarURL({ format: 'jpg' }) !=
      newMember.displayAvatarURL({ format: 'jpg' });
    const isNewNickname = oldMember.username != newMember.username;

    if (isNewAvatar) {
      this.container.logger.info(newMember.username, 'сменил аватарку');
    }
    if (isNewNickname) {
      this.container.logger.info(
        oldMember.username,
        'сменил имя на',
        newMember.username,
      );
    }
    await newMember.fetch();
    const user = await User.findOne(newMember.id);
    if (user) {
      user.username = newMember.username;
      user.avatar = newMember.displayAvatarURL({ format: 'jpg' });
      user.banner = newMember.bannerURL({ format: 'jpg' });
      await user.save();
    }
  }
}
