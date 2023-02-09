import { execSync } from 'child_process';
import type { TextChannel } from 'discord.js';
import { Events, Listener, container, Piece, Store } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { CHANNEL_IDS, SERVER_ID } from '../configs/discord-constants';
import { DirectusService } from '../lib/directus/services';

@ApplyOptions<Listener.Options>({ once: true, event: Events.ClientReady })
export class ReadyListener extends Listener<typeof Events.ClientReady> {
  async run() {
    const stores = [...this.container.stores.values()];

    for (const s of stores) {
      container.logger.info(
        this.styleStore(s, stores.indexOf(s) + 1 === stores.length),
      );
    }

    await this.updateRgdInfo();

    container.logger.info(
      '-> Bot successfully started! Listening to commands...',
    );
  }

  private async updateRgdInfo() {
    this.container.rgd = await this.container.client.guilds.fetch(SERVER_ID);
    const isDev = process.env.NODE_ENV === 'development';

    this.container.mainChannel = (await this.container.rgd.channels.fetch(
      CHANNEL_IDS[isDev ? 'DEBUG' : 'MAIN'],
    )) as TextChannel;

    this.container.debugChannel = (await this.container.rgd.channels.fetch(
      CHANNEL_IDS.DEBUG,
    )) as TextChannel;

    this.container.logger.info(
      `Using '${this.container.mainChannel.name}' channel`,
    );

    await DirectusService.updateFull();

    this.container.logger.info('RGD fetched');

    if (!isDev) this.sendBotReady();
  }

  private sendBotReady() {
    const commitCount = execSync('git rev-list --count HEAD').toString('utf8');
    const lastCommit = execSync(
      'git log -1 --pretty=format:"%an, %s"',
    ).toString('utf8');

    const randomEmoji = this.container.rgd.emojis.cache.random();
    const content = `Bot started ${randomEmoji} \nCommit number: \`${commitCount}\` \`\`\`diff\n+ ${lastCommit}\`\`\` `;

    this.container.debugChannel.send({
      content,
    });
  }

  private styleStore(store: Store<Piece>, last: boolean) {
    return `${last ? '└─' : '├─'} Loaded ${store.size
      .toString()
      .padEnd(3, ' ')} ${store.name}`;
  }
}
