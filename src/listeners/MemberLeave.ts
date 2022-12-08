import { Events, Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import type { GuildMember } from 'discord.js';
import { getRandomChatTemplate } from '../lib/helpers/get-chat-template';
import { TemplateType } from '../configs/templates';

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberRemove })
export class MemberLeave extends Listener<typeof Events.GuildMemberRemove> {
  async run(member: GuildMember) {
    const user = await this.container.api.getUser(member.user.id);
    if (user) {
      user.leaveCount++;
      this.container.api.updateUser(user);
    }

    const banList = await member.guild.bans.fetch();

    if (banList.find((user) => user.user.id == member.user.id)) return;

    const message = getRandomChatTemplate(TemplateType.MEMBER_LEAVE, {
      user: `[<@${member.user.id}>] **${member.displayName}**`,
    });

    await this.container.mainChannel.send(message);
    this.container.logger.info(
      `${member.user.username} has leaved from the server`,
    );
  }
}
