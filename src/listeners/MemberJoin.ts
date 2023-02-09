import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { Events, type GuildMember } from 'discord.js';
import { UserRoles, Invites } from '../lib/directus/directus-entities/Discord';
import { TemplateType } from '../lib/directus/directus-entities/Events';
import { User } from '../lib/directus/directus-entities/User';
import { FilterRule } from '../lib/directus/directus-orm/filters';
import { DirectusService } from '../lib/directus/services';

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
      message = DirectusService.getRandomChatTemplate(
        TemplateType.MEMBER_JOIN,
        props,
      );
      message += `|| ${user.leaveCount} раз ||`;
      user.avatar = discordUser.displayAvatarURL({ extension: 'webp' });
      user.banner = discordUser.bannerURL({ extension: 'webp' });
      user.username = discordUser.username;
      if (!user.invite) {
        user.invite = invite.id;
      }

      const userRoles = await UserRoles.find({
        limit: -1,
        filter: new FilterRule().EqualTo('user_id', member.user.id),
      });
      for (const role of userRoles) {
        await member.roles.add(role.Discord_Roles_id);
      }

      await user.save();
    } else {
      message = DirectusService.getRandomChatTemplate(
        TemplateType.MEMBER_FIRST_JOIN,
        props,
      );
      const newUser = await User.create({
        id: member.id,
        avatar: discordUser.displayAvatarURL({ extension: 'webp' }),
        banner: discordUser.bannerURL({ extension: 'webp' }),
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
