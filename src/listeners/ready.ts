import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { Events } from 'discord.js';

import { SERVER_ID } from '@/configs/discord-constants';

@ApplyOptions<Listener.Options>({ event: Events.ClientReady, once: true })
export class Ready extends Listener {
  async run() {
    this.container.rgd = await this.container.client.guilds.fetch(SERVER_ID);

    this.container.logger.info(
      `Logged as ${this.container.client.user?.username}`,
    );

    this.container.logger.info(
      '-> Bot successfully started! Listening to commands...',
    );
  }
}
