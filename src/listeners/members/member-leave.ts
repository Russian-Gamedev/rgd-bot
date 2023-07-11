import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { container } from '@sapphire/pieces';
import { AuditLogEvent, Events, GuildMember } from 'discord.js';

import { SERVER_ID } from '@/configs/constants';
import { User } from '@/lib/database/entities';
import { RgdEvents } from '@/lib/discord/custom-events';
import { getDisplayAvatar, getDisplayBanner } from '@/lib/utils';

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberRemove })
export class MemberLeave extends Listener<typeof Events.GuildMemberRemove> {
  async run(member: GuildMember) {
    if (member.guild.id != SERVER_ID) return;
    let user = await User.findOne({ where: { id: member.id } });

    if (!user) {
      user = User.create({
        id: member.id,
        username: member.user.username,
        avatar: getDisplayAvatar(member.user),
        banner: getDisplayBanner(member.user),
        banner_color: member.displayHexColor,
        leaveCount: 1,
      });
    } else {
      user.leaveCount++;
    }
    await user.save();
    user.leave = true;

    const banList = await member.guild.bans.fetch();
    if (banList.find((user) => user.user.id == member.user.id)) {
      this.container.client.emit(RgdEvents.MemberBan, user);
      container.logger.info(member.displayName, 'banned at server');
      return;
    }

    const fetchedLogs = await member.guild.fetchAuditLogs({
      limit: 1,
      type: AuditLogEvent.MemberKick,
    });

    const kickLog = fetchedLogs.entries.first();

    if (kickLog && kickLog.createdAt > (member.joinedAt ?? 0)) {
      this.container.client.emit(RgdEvents.MemberKick, user);
      container.logger.info(member.displayName, 'kicked from server');
      return;
    }

    this.container.client.emit(RgdEvents.MemberLeave, user);

    container.logger.info(member.displayName, 'left from server');
  }
}
