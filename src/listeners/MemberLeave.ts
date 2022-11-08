import { Events, Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import type { GuildMember } from 'discord.js';

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberRemove })
export class MemberLeave extends Listener<typeof Events.GuildMemberRemove> {
  run(member: GuildMember) {
    let repls: string = this.container.responseManager.get(
      'events',
      'memberLeave',
    );
    repls = repls.replace('%', `**${member.displayName}**`);
    this.container.mainChannel.send(repls);
    this.container.logger.info(member.user.username, 'leave');
  }
}
