import { Events, Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import type { GuildMember } from 'discord.js';
import { getRandomChatTemplate } from '../lib/helpers/get-chat-template';
import { TemplateType } from '../configs/templates';

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberAdd })
export class MemberJoin extends Listener<typeof Events.GuildMemberAdd> {
  async run(member: GuildMember) {
    member = await member.fetch();
    const props = {
      user: `[<@${member.user.id}>] **${member.displayName}**`,
    };

    let message;

    const user = await this.container.api.getUser(member.user.id);

    if (user) {
      message = getRandomChatTemplate(TemplateType.MEMBER_JOIN, props);
      message += `|| ${user.leaveCount} раз ||`;
      this.container.api.updateUser({
        id: member.id,
        avatar: member.displayAvatarURL({ format: 'webp' }),
        banner: member.user.bannerURL({ format: 'webp' }),
      });
    } else {
      message = getRandomChatTemplate(TemplateType.MEMBER_FIRST_JOIN, props);
      this.container.api.createUser({
        id: member.id,
        avatar: member.displayAvatarURL({ format: 'webp' }),
        banner: member.user.bannerURL({ format: 'webp' }),
      });
    }

    await this.container.mainChannel.send(message);
    this.container.logger.info(
      `${member.user.username} has joined in the server`,
    );
  }
}
