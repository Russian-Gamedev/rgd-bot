import { Events, Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import type { GuildMember } from 'discord.js';
import { getChatTemplate } from '../lib/helpers/get-chat-template';
import { TemplateType } from '../configs/templates';

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberRemove })
export class MemberLeave extends Listener<typeof Events.GuildMemberRemove> {
  async run(member: GuildMember) {
    const message = getChatTemplate(TemplateType.MEMBER_LEAVE, {
      user: `[<@${member.user.id}>] **${member.displayName}**`,
    });

    await this.container.mainChannel.send(message);
    this.container.logger.info(
      `${member.user.username} has leaved from the server`,
    );
  }
}
