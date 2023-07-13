import { ApplyOptions } from '@sapphire/decorators';
import { Listener, Piece, Store } from '@sapphire/framework';
import { container } from '@sapphire/pieces';
import { Events, TextChannel } from 'discord.js';

import { CHANNEL_IDS, IS_DEV, SERVER_ID } from '@/configs/constants';
import { BotEventsTemplates, TemplateType } from '@/lib/database/entities';
import { execAsync } from '@/lib/utils';

@ApplyOptions<Listener.Options>({ event: Events.ClientReady, once: true })
export class Ready extends Listener {
  async run() {
    this.container.rgd = await this.container.client.guilds.fetch(SERVER_ID);
    container.logger.info(`Looking up '${this.container.rgd.name}' server`);

    const [debugChannel, mainChannel] = await Promise.all(
      [CHANNEL_IDS.DEBUG, CHANNEL_IDS.MAIN].map((id) =>
        this.container.rgd.channels.fetch(id),
      ),
    );
    this.container.debugChannel = debugChannel as TextChannel;
    this.container.mainChannel = mainChannel as TextChannel;

    const stores = [...this.container.stores.values()];

    for (const s of stores) {
      this.container.logger.info(
        this.styleStore(s, stores.indexOf(s) + 1 === stores.length),
      );
    }

    if (!IS_DEV) {
      await this.sendReadyMessage();
    }

    this.container.logger.info(
      '-> Bot successfully started! Listening to commands...',
    );

    this.container.logger.info(
      `Logged as ${this.container.client.user?.username}`,
    );

    this.printApiInfo();
  }

  private printApiInfo() {
    const server = this.container.client.server;
    const listenOptions = server.options.listenOptions;
    const routes = [...server.routes.values()];

    for (const route of routes) {
      const line = routes.indexOf(route) + 1 === routes.length ? '└─' : '├─';

      const methods = [...route.methods.keys()].join();

      this.container.logger.info(
        `[API] ${line} ${route.router.path} ${methods}`,
      );
    }

    this.container.logger.info(
      `[API] Server started at http://${listenOptions.host}:${listenOptions.port}`,
    );
  }

  private async sendReadyMessage() {
    const commitCount = await execAsync('git rev-list --count HEAD');
    const props = {
      user: `<@${this.container.client.id}>`,
    };

    let message = await BotEventsTemplates.getRandom(
      TemplateType.MEMBER_JOIN,
      props,
    );

    message += `|| ${commitCount} раз ||`;

    await this.container.mainChannel.send({
      content: message,
    });
  }

  private styleStore(store: Store<Piece>, last: boolean) {
    return `${last ? '└─' : '├─'} Loaded ${store.size
      .toString()
      .padEnd(3, ' ')} ${store.name}`;
  }
}
