import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener, Piece, Store } from '@sapphire/framework';

import { GuildService } from '#base/services/guild.service';
import { InviteService } from '#base/services/invite.service';
import { RGD_ID } from '#config/constants';

@ApplyOptions<Listener.Options>({ event: Events.ClientReady, once: true })
export class Ready extends Listener {
  async run() {
    this.printStores();
    this.printApiInfo();

    this.container.logger.info(
      '-> Bot successfully started! Listening to commands...',
    );

    this.container.logger.info(
      `Logged as ${this.container.client.user?.username}`,
    );

    await this.updateGuild();
  }

  async updateGuild() {
    const guild = await this.container.client.guilds.fetch(RGD_ID);

    await GuildService.Instance.updateInfo(guild);
    await Promise.all([
      GuildService.Instance.updateRoles(guild),
      InviteService.Instance.updateGuildInvites(guild),
    ]);

    this.container.rgd = guild;
  }

  private printApiInfo() {
    const server = this.container.client.server;

    const listenOptions = server.options.listenOptions;
    const routes = [...server.routes.values()];

    this.container.logger.info('API Initializing...');

    for (const route of routes) {
      const line = routes.indexOf(route) + 1 === routes.length ? '└─' : '├─';

      const methods = [...route.methods.keys()].join();
      const path = route.router.path;

      this.container.logger.info(`${line} ${path} ${methods}`);
    }

    this.container.logger.info(
      `API server started at http://${listenOptions.host}:${listenOptions.port}/${server.options.prefix}`,
    );
  }
  private printStores() {
    const stores = [...this.container.stores.values()];

    for (const s of stores) {
      this.container.logger.info(
        this.styleStore(s, stores.indexOf(s) + 1 === stores.length),
      );
    }
  }
  private styleStore(store: Store<Piece>, last: boolean) {
    return `${last ? '└─' : '├─'} Loaded ${store.size
      .toString()
      .padEnd(3, ' ')} ${store.name}`;
  }
}
