import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { Invite } from 'discord.js';

import { InviteService } from '#base/services/invite.service';

@ApplyOptions<Listener.Options>({ event: Events.InviteCreate })
export class InviteCreate extends Listener {
  async run(invite: Invite) {
    if (invite.inviter.bot) return;

    const entity = InviteService.Instance.create(invite);
    await InviteService.Instance.database.persistAndFlush(entity);
  }
}
