import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { container } from '@sapphire/pieces';
import { Events, GuildMember } from 'discord.js';

import { ROLE_IDS, SERVER_ID } from '@/configs/constants';
import { User, UserRoles } from '@/lib/database/entities/';
import { RgdEvents } from '@/lib/discord/custom-events';

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberRemove })
export class MemberLeave extends Listener<typeof Events.GuildMemberRemove> {
  async run(member: GuildMember) {
    if (member.guild.id != SERVER_ID) return;
    const user = await User.ensure(member);
    user.leaveCount++;
    user.leave = true;
    await user.save();

    await this.saveRoles(member);

    if (await this.checkIsBan(member, user)) return;

    this.container.client.emit(RgdEvents.MemberLeave, user);

    container.logger.info(member.displayName, 'left from server');
  }

  private async saveRoles(member: GuildMember) {
    const roles_db = await UserRoles.find({
      where: { user_id: member.id },
    });

    for (const role of roles_db) {
      if (!member.roles.cache.has(role.role_id)) {
        await role.remove();
      }
    }

    for (const role of member.roles.cache.values()) {
      if (role.id === ROLE_IDS.default) continue;
      if (roles_db.some(({ role_id }) => role_id === role.id)) continue;

      const role_db = UserRoles.create({
        role_id: role.id,
        user_id: member.id,
      });

      await role_db.save();
    }
  }

  private async checkIsBan(member: GuildMember, user: User) {
    const banList = await member.guild.bans.fetch();
    if (banList.find((user) => user.user.id == member.user.id)) {
      this.container.client.emit(RgdEvents.MemberBan, user);
      container.logger.info(member.displayName, 'banned at server');
      return true;
    }
    return false;
  }
}
