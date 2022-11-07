import type { TextChannel } from 'discord.js';
import { container, Events, Listener, Piece, Store } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';

@ApplyOptions<Listener.Options>({ once: true, event: Events.ClientReady })
export class ReadyListener extends Listener<typeof Events.ClientReady> {
  run() {
    const stores = [...this.container.stores.values()];

    for (const s of stores) {
      container.logger.info(
        this.styleStore(s, stores.indexOf(s) + 1 === stores.length),
      );
    }

    container.logger.info(
      '-> Bot successfully started! Listening to commands...',
    );
    this.getRgdGuild();
  }

  private async getRgdGuild() {
    this.container.rgd = await this.container.client.guilds.fetch(
      process.env.RGD_ID,
    );

    this.container.mainChannel = (await this.container.rgd.channels.fetch(
      process.env.MAIN_CHANNEL,
    )) as TextChannel;

    this.container.logger.info('RGD fetched');
  }

  private styleStore(store: Store<Piece>, last: boolean) {
    return `${last ? '└─' : '├─'} Loaded ${store.size
      .toString()
      .padEnd(3, ' ')} ${store.name}`;
  }
}
