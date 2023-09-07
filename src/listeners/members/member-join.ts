import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { container } from '@sapphire/pieces';
import { Events, GuildMember, TextChannel } from 'discord.js';

import { RGD_SERVER_ID, ROLE_IDS, SERVER_ID } from '@/configs/constants';
import { User, UserRoles } from '@/lib/database/entities';
import { DiscordInvites } from '@/lib/database/entities/discord/InviteEntity';
import { RgdEvents } from '@/lib/discord/custom-events';

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberAdd })
export class MemberJoin extends Listener<typeof Events.GuildMemberAdd> {
  async run(member: GuildMember) {
    if (member.guild.id != SERVER_ID) return;
    const invite = await this.findInviteUpdated();
    let user = await User.findOne({ where: { id: member.id } });

    if (!user) {
      user = await User.ensure(member);
      user.invite = invite.id;
      await user.save();
      this.container.client.emit(RgdEvents.MemberFirstJoin, user);
    } else {
      user.leave = false;
      if (invite && !user.invite) {
        user.invite = invite.id;
      }

      await user.save();

      await this.loadRoles(member);

      this.container.client.emit(RgdEvents.MemberJoin, user);
    }

    await this.notifyInviteTrack(user, invite);

    container.logger.info(member.displayName, 'join to server');
  }

  private async loadRoles(member: GuildMember) {
    const roles_db = await UserRoles.find({ where: { user_id: member.id } });

    for (const role of roles_db) {
      if (role.role_id === ROLE_IDS.default) continue;
      if (role.role_id === ROLE_IDS.NITRO) continue;
      if (member.roles.cache.has(role.role_id)) continue;
      await member.roles.add(role.role_id);
    }
  }

  private async notifyInviteTrack(user: User, invite: DiscordInvites) {
    const channel = (await this.container.rgd.channels.fetch(
      '504618938517159946',
    )) as TextChannel;
    const thread = await channel.threads.fetch('1142029578504785952');

    let description = '';
    if (invite) {
      if (invite.alias) {
        description = `<@${user.id}> прибыл из ${invite.alias}`;
      } else if (invite.inviter) {
        description = `<@${user.id}> приглашен <@${invite.inviter}>`;
      }
    } else {
      description = `<@${user.id}> пришел не известно откуда`;
    }

    console.log(description);

    thread.send({
      embeds: [
        {
          description,
        },
      ],
    });
  }

  private async findInviteUpdated() {
    const cachedInvites = await DiscordInvites.find();
    const guild = await this.container.client.guilds.fetch(RGD_SERVER_ID);
    const invites = await guild.invites.fetch();

    for (const [, invite] of invites) {
      const directusInvite = cachedInvites.find(
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
