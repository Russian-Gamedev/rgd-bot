import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { GuildMember } from 'discord.js';

import { BotEventsService } from '#base/services/events.service';
import { GuildSettingService } from '#base/services/guild-setting.service';
import { UserService } from '#base/services/user.service';
import { BotEvents, RGD_ID } from '#config/constants';

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberRemove })
export class MemberLeave extends Listener<typeof Events.GuildMemberRemove> {
  get userService() {
    return UserService.Instance;
  }

  get botEventsService() {
    return BotEventsService.Instance;
  }

  get settingsService() {
    return GuildSettingService.Instance;
  }

  async run(member: GuildMember) {
    if (member.guild.id !== RGD_ID) return;
    const user = await this.userService.get(member.id);

    user.leave_count++;
    user.left_guild = true;

    await this.userService.database.persistAndFlush(user);

    await this.userService.saveRoles(member);

    const message = await this.botEventsService.getRandom(
      BotEvents.MEMBER_LEAVE,
      {
        user: `[<@${user.id}>] **${member.displayName}**`,
      },
    );

    const channel = await this.settingsService.getSystemChannel();
    channel.send(message);

    this.container.logger.info(member.displayName, 'leave server');
  }
}
