import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { Events, Invite } from 'discord.js';

import { DiscordInvites } from '#lib/database/entities/discord/InviteEntity';

@ApplyOptions<Listener.Options>({ event: Events.InviteCreate })
export class InviteCreate extends Listener<typeof Events.InviteCreate> {
  async run(invite: Invite) {
    if (invite.inviter.bot) return;

    const dInvite = DiscordInvites.create({
      id: invite.code,
      inviter: invite.inviterId,
    });
    await dInvite.save();
  }
}
