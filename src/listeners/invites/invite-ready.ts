import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';

import { RGD_SERVER_ID } from '#configs/constants';
import { DiscordInvites } from '#lib/database/entities/discord/InviteEntity';
import { RgdEvents } from '#lib/discord/custom-events';

@ApplyOptions<Listener.Options>({ event: RgdEvents.Ready, once: true })
export class InviteReady extends Listener {
  async run() {
    const guild = await this.container.client.guilds.fetch(RGD_SERVER_ID);
    const invites = await guild.invites.fetch();

    const promises = invites.map(async (invite) => {
      if (invite.inviter.bot) return;
      try {
        let directusInvite = await DiscordInvites.findOne({
          where: { id: invite.code },
        });

        if (!directusInvite) {
          directusInvite = DiscordInvites.create({
            id: invite.code,
            inviter: invite.inviterId,
          });
        }
        directusInvite.date_created = invite.createdAt;
        directusInvite.uses = invite.uses;

        await directusInvite.save();
      } catch (e) {}
    });

    await Promise.allSettled(promises);

    this.container.logger.info(`${invites.size} invites updated`);

    const cachedInvites = await DiscordInvites.find();

    let deletedCount = 0;

    for (const invite of cachedInvites) {
      if (!invites.has(invite.id)) {
        await invite.remove();
        deletedCount++;
      }
    }

    this.container.logger.info(`${deletedCount} deleted`);
  }
}
