import { Injectable, Logger } from '@nestjs/common';
import { Context, type ContextOf, On, Once } from 'necord';

import { GuildInviteService } from './invite.service';

@Injectable()
export class GuildInviteWatcher {
  private readonly logger = new Logger(GuildInviteWatcher.name);

  constructor(private readonly guildInviteService: GuildInviteService) {}

  @Once('clientReady')
  async onReady(@Context() [client]: ContextOf<'clientReady'>) {
    this.logger.log('GuildInviteWatcher is ready and listening for events.');
    const guilds = client.guilds.cache.values();
    for (const guild of guilds) {
      await this.guildInviteService.syncGuildInvites(guild.id);
    }
  }

  @On('inviteCreate')
  async onInviteCreate(@Context() [invite]: ContextOf<'inviteCreate'>) {
    this.logger.log(
      `Invite created: ${invite.code} for guild ${invite.guild?.id}`,
    );
    await this.guildInviteService.create(invite);
  }

  @On('inviteDelete')
  async onInviteDelete(@Context() [invite]: ContextOf<'inviteDelete'>) {
    this.logger.log(
      `Invite deleted: ${invite.code} for guild ${invite.guild?.id}`,
    );
    await this.guildInviteService.delete(invite);
  }
}
