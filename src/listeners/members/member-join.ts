import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { container } from '@sapphire/pieces';
import { GuildMember } from 'discord.js';

import { InviteService } from '#base/services/invite.service';
import { UserService } from '#base/services/user.service';
import { RGD_ID } from '#config/constants';

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberAdd })
export class MemberJoin extends Listener<typeof Events.GuildMemberAdd> {
  get userService() {
    return UserService.Instance;
  }

  get inviteService() {
    return InviteService.Instance;
  }

  async run(member: GuildMember) {
    if (member.guild.id !== RGD_ID) return;

    const recentInvite = await this.inviteService.findRecentUpdated(
      member.guild,
    );

    const user = await this.userService.get(member.id);

    user.left_guild = false;

    if (user.is_new) {
      /// send message
    } else {
      await this.userService.loadRoles(member);
    }

    if (recentInvite && !user.invite) {
      user.invite = recentInvite.invite_id;
    }

    await this.userService.database.persistAndFlush(user);

    container.logger.info(member.displayName, 'joined to server');
  }
}
