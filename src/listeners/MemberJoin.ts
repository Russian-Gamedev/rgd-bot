import { Events, Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import type { GuildMember } from 'discord.js';

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberAdd })
export class MemberJoin extends Listener<typeof Events.GuildMemberAdd> {
  run(member: GuildMember) {
    let repls: string = this.container.responseManager.get(
      'events',
      'memberJoin',
    );
    repls = repls.replace('%', `**${member.displayName}**`);
    this.container.mainChannel.send(repls);
    this.container.logger.info(member.user.username, 'join');
  }
}
