import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { container } from '@sapphire/pieces';
import { GuildMember } from 'discord.js';

import { UserService } from '#base/services/user.service';
import { RGD_ID } from '#config/constants';

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberRemove })
export class MemberLeave extends Listener<typeof Events.GuildMemberRemove> {
  get userService() {
    return UserService.Instance;
  }

  async run(member: GuildMember) {
    if (member.guild.id !== RGD_ID) return;
    const user = await this.userService.get(member.id);

    user.leave_count++;
    user.left_guild = true;

    await this.userService.database.persistAndFlush(user);

    await this.userService.saveRoles(member);

    container.logger.info(member.displayName, 'leave server');
  }
}
