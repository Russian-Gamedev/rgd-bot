import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { container } from '@sapphire/pieces';
import { GuildMember } from 'discord.js';

import { InviteService } from '#base/services/invite.service';
import { UserService } from '#base/services/user.service';

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberAdd })
export class MemberJoin extends Listener<typeof Events.GuildMemberAdd> {
  get userService() {
    return UserService.Instance;
  }

  get inviteService() {
    return InviteService.Instance;
  }

  async run(member: GuildMember) {
    const recentInvite = await this.inviteService.findRecentUpdated(
      member.guild,
    );

    const user = await this.userService.get(member.id);
    if (user.is_new) {
      /// send message
    }

    if (recentInvite && !user.invite) {
      user.invite = recentInvite.invite_id;

      await this.userService.database.persistAndFlush(user);
    }

    container.logger.info(member.displayName, 'joined to server');
  }
}
