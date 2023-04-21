import { Events, Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import type { GuildMember } from 'discord.js';
import { UserRoles } from '@/lib/directus/directus-entities/Discord';
import { FilterRule } from '@/lib/directus/directus-orm/filters';

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
      filter: new FilterRule().EqualTo('user_id', oldMember.id),
    });

    for (const role of deletedRoles) {
      const findRole = userRoles.find(
        (userRole) => userRole.Discord_Roles_id === role,
      );
      if (findRole) await findRole.delete();
    }

    for (const role of addedRoles) {
      const findRole = userRoles.find(
        (userRole) => userRole.Discord_Roles_id === role,
      );
      if (!findRole) {
        const userRole = UserRoles.create({
          Discord_Roles_id: role,
          user_id: oldMember.id,
        });
        await userRole.save();
      }
    }
  }
}
