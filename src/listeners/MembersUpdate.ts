import { container, Events, Listener, Piece, Store } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import type { GuildMember } from 'discord.js';

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberAdd })
export class MemberJoin extends Listener<typeof Events.GuildMemberAdd> {
  run(member: GuildMember) {
    this.container.mainChannel.send(`Добро пожаловать <@${member.id}>`);
    this.container.logger.info(member.user.username, 'join');
  }
}

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberRemove })
export class MemberLeave extends Listener<typeof Events.GuildMemberRemove> {
  run(member: GuildMember) {
    this.container.mainChannel.send(`<@${member.id}> вышел`);
    this.container.logger.info(member.user.username, 'leave');
  }
}
