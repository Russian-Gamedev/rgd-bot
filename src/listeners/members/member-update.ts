import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { GuildMember, User } from 'discord.js';

import { UserService } from '#base/services/user.service';

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberUpdate })
export class MemberUpdate extends Listener<typeof Events.GuildMemberUpdate> {
  get userService() {
    return UserService.Instance;
  }

  async run(oldMember: GuildMember, newMember: GuildMember) {
    await Promise.all([
      this.processUserInfo(oldMember, newMember),
      this.processRoles(oldMember, newMember),
    ]);
  }

  async processUserInfo(oldMember: GuildMember, newMember: GuildMember) {
    const watch_field: Array<keyof User> = [
      'username',
      'avatar',
      'banner',
      'hexAccentColor',
    ];

    const isNeedUpdate = watch_field.reduce(
      (accumulate, field) =>
        accumulate || oldMember.user[field] !== newMember.user[field],
      false,
    );

    if (isNeedUpdate) {
      await this.userService.updateInfo(newMember.guild.id, newMember);
    }
  }

  async processRoles(oldMember: GuildMember, newMember: GuildMember) {
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

    if (deletedRoles.length > 0 || addedRoles.length > 0) {
      await this.userService.saveRoles(newMember.guild.id, newMember);
    }
  }
}
