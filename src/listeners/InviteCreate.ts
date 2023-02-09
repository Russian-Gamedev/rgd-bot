import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { Events, type Invite } from 'discord.js';
import { Invites } from '../lib/directus/directus-entities/Discord';

@ApplyOptions<Listener.Options>({ event: Events.InviteCreate })
export class MemberBan extends Listener<typeof Events.InviteCreate> {
  async run(invite: Invite) {
    if (invite.inviter.bot) return;

    const dInvite = Invites.create({
      id: invite.code,
      inviter: invite.inviterId,
    });
    await dInvite.save();
  }
}
