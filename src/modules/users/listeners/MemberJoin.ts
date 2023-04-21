import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { Events, type GuildMember } from 'discord.js';
import { Invites, UserRoles } from '@/lib/directus/directus-entities/Discord';
import { TemplateType } from '@/lib/directus/directus-entities/Events';
import { User } from '@/lib/directus/directus-entities/User';
import { FilterRule } from '@/lib/directus/directus-orm/filters';
import { DirectusService } from '@/lib/directus/services';

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberAdd })
export class MemberJoin extends Listener<typeof Events.GuildMemberAdd> {
  async run(member: GuildMember) {
    let user = await User.findOne(member.user.id);
    const invite = await this.findInviteUpdated();
    const isNewUser = user === null;
    const userInfo = await this.getMemberInfo(member);

    if (user) {
      user.leaveCount++;
      if (!user.invite) {
        user.invite = invite.id;
      }
      await this.equipUserRoles(member);
    } else {
      user = await User.create({
        id: member.id,
        firstJoin: new Date().toISOString(),
        invite: invite.id,
      });
    }

    Object.assign(user, userInfo);
    await user.save();

    const props = {
      user: `<@${member.user.id}>`,
    };

    const type = isNewUser
      ? TemplateType.MEMBER_FIRST_JOIN
      : TemplateType.MEMBER_JOIN;
    let message = DirectusService.getRandomChatTemplate(type, props);

    if (!isNewUser) {
      message += `|| ${user.leaveCount} раз ||`;
    }

    await this.container.mainChannel.send(message);
    this.container.logger.info(
      `${member.user.username} has joined in the server`,
    );
  }

  private async getMemberInfo(member: GuildMember) {
    const user = await member.user.fetch();
    return {
      avatar: user.displayAvatarURL({ extension: 'webp' }),
      banner: user.bannerURL({ extension: 'webp' }),
      username: user.username,
    };
  }

  private async equipUserRoles(member: GuildMember) {
    const userRoles = await UserRoles.find({
      limit: -1,
      filter: new FilterRule().EqualTo('user_id', member.user.id),
    });
    for (const role of userRoles) {
      await member.roles.add(role.Discord_Roles_id);
    }
  }

  private async findInviteUpdated() {
    const directusInvites = await Invites.find({ limit: -1 });
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
