import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { Events, GuildMember } from 'discord.js';

import { UserRoles } from '#lib/database/entities';

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberUpdate })
export class MemberUpdate extends Listener<typeof Events.GuildMemberUpdate> {
  async run(oldMember: GuildMember, newMember: GuildMember) {
    const deletedRoles: string[] = [];
    const addedRoles: string[] = [];

    if (oldMember.roles.cache.size > newMember.roles.cache.size) {
      for (const [role] of oldMember.roles.cache) {
        if (!newMember.roles.cache.has(role)) {
          deletedRoles.push(role);
        }
      }
    }
    if (oldMember.roles.cache.size < newMember.roles.cache.size) {
      for (const [role] of newMember.roles.cache) {
        if (!oldMember.roles.cache.has(role)) {
          addedRoles.push(role);
        }
      }
    }

    const userRoles = await UserRoles.find({
      where: {
        user_id: oldMember.id,
      },
    });

    for (const role of deletedRoles) {
      const findRole = userRoles.find((userRole) => userRole.role_id === role);
      if (findRole) await findRole.remove();
    }

    for (const role of addedRoles) {
      const findRole = userRoles.find((userRole) => userRole.role_id === role);
      if (!findRole) {
        const userRole = UserRoles.create({
          role_id: role,
          user_id: oldMember.id,
        });
        await userRole.save();
      }
    }
  }
}
