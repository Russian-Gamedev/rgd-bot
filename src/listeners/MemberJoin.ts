import { Events, Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import type { GuildMember } from 'discord.js';
import { getRandomChatTemplate } from '../lib/helpers/get-chat-template';
import { TemplateType } from '../configs/templates';
import { User } from '../lib/services/entities/User';
import { Invites, UserRoles } from '../lib/services/entities/Discord';

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberAdd })
export class MemberJoin extends Listener<typeof Events.GuildMemberAdd> {
  async run(member: GuildMember) {
    const props = {
      user: `<@${member.user.id}>`,
    };

    let message;

    const user = await User.findOne(member.user.id);
    const invite = await this.findInviteUpdated();
    const discordUser = await member.user.fetch();

    if (user) {
      user.leaveCount++;
      message = getRandomChatTemplate(TemplateType.MEMBER_JOIN, props);
      message += `|| ${user.leaveCount} раз ||`;
      user.avatar = discordUser.displayAvatarURL({ format: 'webp' });
      user.banner = discordUser.bannerURL({ format: 'webp' });
      user.username = discordUser.username;
      if (!user.invite) {
        user.invite = invite.id;
      }

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
        invite: invite.id,
      });
      await newUser.save();
    }

    await this.container.mainChannel.send(message);
    this.container.logger.info(
      `${member.user.username} has joined in the server`,
    );
  }

  private async findInviteUpdated() {
    const directusInvites = await Invites.find(true);
    const discordInvites = await this.container.rgd.invites.fetch();
    for (const [, invite] of discordInvites) {
      const directusInvite = directusInvites.find(
        (inv) => inv.id === invite.code,
      );
      if (directusInvite) {
        if (directusInvite.uses < invite.uses) {
          directusInvite.uses = invite.uses;
          await directusInvite.save();

          return directusInvite;
        }
      }
    }
    return null;
  }
}
