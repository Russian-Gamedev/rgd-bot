import { Events, Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import type { GuildMember } from 'discord.js';
import { getRandomChatTemplate } from '../lib/helpers/get-chat-template';
import { TemplateType } from '../configs/templates';
import { User } from '../lib/services/entities/User';
import { UserRoles } from '../lib/services/entities/Discord';

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberAdd })
export class MemberJoin extends Listener<typeof Events.GuildMemberAdd> {
  async run(member: GuildMember) {
    const props = {
      user: `<@${member.user.id}>`,
    };

    let message;

    const user = await User.findOne(member.user.id);
    const discordUser = await member.user.fetch();
    if (user) {
      message = getRandomChatTemplate(TemplateType.MEMBER_JOIN, props);
      message += `|| ${user.leaveCount} раз ||`;
      user.avatar = discordUser.displayAvatarURL({ format: 'webp' });
      user.banner = discordUser.bannerURL({ format: 'webp' });
      user.username = discordUser.username;

      const userRoles = await UserRoles.find(true, {
        filter: {
          user_id: member.user.id,
        },
      });
      for (const role of userRoles) {
        await member.roles.add(role.Discord_Roles_id);
      }

      await user.save();
    } else {
      message = getRandomChatTemplate(TemplateType.MEMBER_FIRST_JOIN, props);
      const newUser = await User.create({
        id: member.id,
        avatar: discordUser.displayAvatarURL({ format: 'webp' }),
        banner: discordUser.bannerURL({ format: 'webp' }),
        username: discordUser.username,
        firstJoin: new Date().toISOString(),
      });
      await newUser.save();
    }

    await this.container.mainChannel.send(message);
    this.container.logger.info(
      `${member.user.username} has joined in the server`,
    );
  }
}
