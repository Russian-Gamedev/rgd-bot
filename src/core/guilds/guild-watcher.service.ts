import { Injectable, Logger } from '@nestjs/common';
import { Client } from 'discord.js';
import { Context, type ContextOf, On } from 'necord';

import { GuildEvents } from '#config/guilds';
import { UserService } from '#core/users/users.service';

import { GuildEventService } from './events/guild-events.service';
import { GuildSettingsService } from './settings/guild-settings.service';

@Injectable()
export class GuildWatcherService {
  private readonly logger = new Logger(GuildWatcherService.name);

  constructor(
    private readonly discord: Client,
    private readonly guildSettingsService: GuildSettingsService,
    private readonly guildEventsService: GuildEventService,
    private readonly userService: UserService,
  ) {}

  @On('guildMemberAdd')
  async onMemberJoin(@Context() [member]: ContextOf<'guildMemberAdd'>) {
    this.logger.log(
      `Member ${member.displayName} joined guild ${member.guild.name}`,
    );
    const guild = await member.guild.fetch();
    if (!guild) return;

    const user = await this.userService.findOrCreate(guild.id, member.id);

    const isNewUser = user.is_left_guild === false;

    if (!isNewUser) {
      await this.userService.rejoinGuild(user);
    }

    const channel = await this.guildSettingsService.getEventMessageChannel(
      guild.id,
    );
    if (!channel) return;

    const event = isNewUser
      ? GuildEvents.MEMBER_FIRST_JOIN
      : GuildEvents.MEMBER_JOIN;

    let message = await this.guildEventsService.getRandom(guild.id, event, {
      user: `<@${member.id}>`,
    });

    message ??= 'Приветствуем <@' + member.id + '> на сервере!';

    if (!isNewUser) {
      message += `|| ${user.left_count} раз||`;
    }

    await channel.send(message);

    if (isNewUser) return;

    await this.userService.loadRoles(user);
  }

  @On('guildMemberRemove')
  async onMemberLeave(@Context() [member]: ContextOf<'guildMemberRemove'>) {
    this.logger.log(
      `Member ${member.displayName} left guild ${member.guild.name}`,
    );
    const guild = await member.guild.fetch();
    if (!guild) return;

    const user = await this.userService.findOrCreate(guild.id, member.id);
    await this.userService.leaveGuild(user);

    const roles = member.roles.cache;

    if (roles.size === 0) return;

    this.logger.log(
      `Saving roles for user ${member.displayName} in guild ${guild.name}`,
    );
    await this.userService.saveRoles(user, roles);

    const channel = await this.guildSettingsService.getEventMessageChannel(
      guild.id,
    );
    if (!channel) return;

    let message = await this.guildEventsService.getRandom(
      guild.id,
      GuildEvents.MEMBER_LEAVE,
      {
        user: `[<@${member.id}>] **${member.displayName}**`,
      },
    );

    message ??= '<@' + member.id + '> покинул сервер.';

    await channel.send(message);
  }
}
