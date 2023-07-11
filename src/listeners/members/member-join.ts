import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { container } from '@sapphire/pieces';
import { Events, GuildMember } from 'discord.js';

import { SERVER_ID } from '@/configs/constants';
import { User, UserRoles } from '@/lib/database/entities';
import { RgdEvents } from '@/lib/discord/custom-events';

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberAdd })
export class MemberJoin extends Listener<typeof Events.GuildMemberAdd> {
  async run(member: GuildMember) {
    if (member.guild.id != SERVER_ID) return;

    let user = await User.findOne({ where: { id: member.id } });

    if (!user) {
      user = await User.ensure(member);
      this.container.client.emit(RgdEvents.MemberFirstJoin, user);
    } else {
      user.leave = false;
      await user.save();

      await this.loadRoles(member);

      this.container.client.emit(RgdEvents.MemberJoin, user);
    }

    container.logger.info(member.displayName, 'join to server');
  }

  private async loadRoles(member: GuildMember) {
    const roles_db = await UserRoles.find({ where: { user_id: member.id } });

    for (const role of roles_db) {
      if (member.roles.cache.has(role.role_id)) continue;
      await member.roles.add(role.role_id);
    }
  }
}
