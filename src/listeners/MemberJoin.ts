import { Events, Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import type { GuildMember } from 'discord.js';
import { getRandomChatTemplate } from '../lib/helpers/get-chat-template';
import { TemplateType } from '../configs/templates';
import { User } from '../lib/services/entities/User';

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberAdd })
export class MemberJoin extends Listener<typeof Events.GuildMemberAdd> {
  async run(member: GuildMember) {
    const props = {
      user: `[<@${member.user.id}>] **${member.displayName}**`,
    };

    let message;

    const user = await User.findOne(member.user.id);

    const discordUser = await member.user.fetch();

    if (user) {
      message = getRandomChatTemplate(TemplateType.MEMBER_JOIN, props);
      message += `|| ${user.leaveCount} раз ||`;
      user.avatar = discordUser.displayAvatarURL({ format: 'webp' });
      user.banner = discordUser.bannerURL({ format: 'webp' });
      await user.save();
    } else {
      message = getRandomChatTemplate(TemplateType.MEMBER_FIRST_JOIN, props);
      await User.create({
        id: member.id,
        avatar: discordUser.displayAvatarURL({ format: 'webp' }),
        banner: discordUser.bannerURL({ format: 'webp' }),
      });
    }

    await this.container.mainChannel.send(message);
    this.container.logger.info(
      `${member.user.username} has joined in the server`,
    );
  }
}
