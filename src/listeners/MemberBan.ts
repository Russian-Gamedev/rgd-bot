import { Events, Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import type { GuildMember } from 'discord.js';
import { getRandomChatTemplate } from '../lib/helpers/get-chat-template';
import { TemplateType } from '../configs/templates';

@ApplyOptions<Listener.Options>({ event: Events.GuildBanAdd })
export class MemberBan extends Listener<typeof Events.GuildBanAdd> {
  async run(member: GuildMember) {
    const message = getRandomChatTemplate(TemplateType.MEMBER_BAN, {
      user: `[<@${member.user.id}>] **${member.user.username}**`,
    });

    await this.container.mainChannel.send(message);
    this.container.logger.info(
      `${member.user.username} has banned from the server`,
    );
  }
}
