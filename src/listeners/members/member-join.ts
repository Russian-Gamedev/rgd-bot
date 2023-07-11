import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { container } from '@sapphire/pieces';
import { Events, GuildMember } from 'discord.js';

import { SERVER_ID } from '@/configs/constants';
import { User } from '@/lib/database/entities';
import { RgdEvents } from '@/lib/discord/custom-events';
import { getDisplayAvatar, getDisplayBanner } from '@/lib/utils';

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberAdd })
export class MemberJoin extends Listener<typeof Events.GuildMemberAdd> {
  async run(member: GuildMember) {
    console.log(member.guild.id);
    if (member.guild.id != SERVER_ID) return;

    let user = await User.findOne({ where: { id: member.id } });
    if (!user) {
      user = User.create({
        id: member.id,
        username: member.user.username,
        avatar: getDisplayAvatar(member.user),
        banner: getDisplayBanner(member.user),
        banner_color: member.displayHexColor,
      });

      await user.save();

      this.container.client.emit(RgdEvents.MemberFirstJoin, user);
    } else {
      user.leave = false;
      await user.save();

      this.container.client.emit(RgdEvents.MemberJoin, user);
    }

    container.logger.info(member.displayName, 'join to server');
  }
}
