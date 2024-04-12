import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { container } from '@sapphire/pieces';
import { GuildMember } from 'discord.js';

import { BotEventsService } from '#base/services/events.service';
import { GuildSettingService } from '#base/services/guild-setting.service';
import { InviteService } from '#base/services/invite.service';
import { UserService } from '#base/services/user.service';
import { BotEvents } from '#config/constants';

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberAdd })
export class MemberJoin extends Listener<typeof Events.GuildMemberAdd> {
  get userService() {
    return UserService.Instance;
  }

  get inviteService() {
    return InviteService.Instance;
  }

  get botEventsService() {
    return BotEventsService.Instance;
  }
  get settingsService() {
    return GuildSettingService.Instance;
  }

  async run(member: GuildMember) {
    container.logger.info(member.displayName, 'joined to server');

    const recentInvite = await this.inviteService.findRecentUpdated(
      member.guild,
    );

    const user = await this.userService.get(member.guild.id, member.id);

    user.left_guild = false;

    if (!user.is_new) {
      container.logger.info('loading roles for member');
      await this.userService.loadRoles(member.guild.id, member);
    }

    if (recentInvite && !user.invite) {
      user.invite = recentInvite.id;
    }

    const event = user.is_new
      ? BotEvents.MEMBER_FIRST_JOIN
      : BotEvents.MEMBER_JOIN;

    let message = await this.botEventsService.getRandom(
      member.guild.id,
      event,
      {
        user: `<@${member.id}>`,
      },
    );

    if (!user.is_new) {
      message += `|| ${user.leave_count} раз ||`;
    }

    const channel = await this.settingsService.getSystemChannel(
      member.guild.id,
    );
    channel.send(message);

    await this.userService.database.persistAndFlush(user);
  }
}
