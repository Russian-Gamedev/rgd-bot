import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { GuildMember, User } from 'discord.js';

import { UserService } from '#base/services/user.service';
import { RGD_ID } from '#config/constants';

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberUpdate })
export class MemberUpdate extends Listener<typeof Events.GuildMemberUpdate> {
  get userService() {
    return UserService.Instance;
  }

  async run(oldMember: GuildMember, newMember: GuildMember) {
    if (oldMember.guild.id !== RGD_ID) return;
    await Promise.all([this.processUserInfo(oldMember, newMember)]);
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
      await this.userService.updateInfo(newMember);
    }
  }
}
