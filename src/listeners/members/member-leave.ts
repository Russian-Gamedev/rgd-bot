import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { GuildMember } from 'discord.js';

import { BotEventsService } from '#base/services/events.service';
import { GuildSettingService } from '#base/services/guild-setting.service';
import { UserService } from '#base/services/user.service';
import { BotEvents } from '#config/constants';

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
    const user = await this.userService.get(member.guild.id, member.id);

    user.leave_count++;
    user.left_guild = true;

    await this.userService.database.persistAndFlush(user);

    await this.userService.saveRoles(member.guild.id, member);

    const message = await this.botEventsService.getRandom(
      member.guild.id,
      BotEvents.MEMBER_LEAVE,
      {
        user: `[<@${member.id}>] **${member.displayName}**`,
      },
    );

    const channel = await this.settingsService.getSystemChannel(
      member.guild.id,
    );
    channel.send(message);

    this.container.logger.info(member.displayName, 'leave server');
  }
}
