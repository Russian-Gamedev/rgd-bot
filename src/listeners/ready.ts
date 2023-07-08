import { ApplyOptions } from '@sapphire/decorators';
import { Listener, Piece, Store } from '@sapphire/framework';
import { Events } from 'discord.js';

import { SERVER_ID } from '@/configs/constants';

@ApplyOptions<Listener.Options>({ event: Events.ClientReady, once: true })
export class Ready extends Listener {
  async run() {
    this.container.rgd = await this.container.client.guilds.fetch(SERVER_ID);

    const stores = [...this.container.stores.values()];

    for (const s of stores) {
      this.container.logger.info(
        this.styleStore(s, stores.indexOf(s) + 1 === stores.length),
      );
    }

    this.container.logger.info(
      '-> Bot successfully started! Listening to commands...',
    );

    this.container.logger.info(
      `Logged as ${this.container.client.user?.username}`,
    );
  }

  private styleStore(store: Store<Piece>, last: boolean) {
    return `${last ? '└─' : '├─'} Loaded ${store.size
      .toString()
      .padEnd(3, ' ')} ${store.name}`;
  }
}
