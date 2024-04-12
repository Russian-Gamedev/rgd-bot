import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { Invite } from 'discord.js';

import { InviteEntity } from '#base/entities/invite.entity';
import { InviteService } from '#base/services/invite.service';

@ApplyOptions<Listener.Options>({ event: Events.InviteDelete })
export class InviteDelete extends Listener {
  async run(invite: Invite) {
    if (invite.inviter.bot) return;

    await InviteService.Instance.database.nativeDelete(InviteEntity, {
      id: invite.code,
      guild_id: invite.guild.id,
    });
  }
}
