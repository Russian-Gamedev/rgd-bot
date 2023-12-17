import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { Events, Invite } from 'discord.js';

import { DiscordInvites } from '#lib/database/entities/discord/InviteEntity';

@ApplyOptions<Listener.Options>({ event: Events.InviteDelete })
export class InviteDelete extends Listener<typeof Events.InviteDelete> {
  async run(invite: Invite) {
    if (invite.inviter.bot) return;

    await DiscordInvites.delete({ id: invite.code });
  }
}
