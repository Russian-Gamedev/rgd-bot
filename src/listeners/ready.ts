import type { TextChannel } from 'discord.js';
import { container, Events, Listener, Piece, Store } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { CHANNEL_IDS, SERVER_ID } from '../configs/discord-constants';
import {
  DiscordChannel,
  DiscordRole,
  RoleBindings,
} from '../lib/services/entities/Discord';
import { execSync } from 'child_process';

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

    this.getRgdGuild().catch((e) => container.logger.error(e));
  }

  private async getRgdGuild() {
    this.container.rgd = await this.container.client.guilds.fetch(SERVER_ID);

    const isDev = process.env.NODE_ENV === 'development';

    this.container.mainChannel = (await this.container.rgd.channels.fetch(
      CHANNEL_IDS[isDev ? 'DEBUG' : 'MAIN'],
    )) as TextChannel;
    this.container.debugChannel = (await this.container.rgd.channels.fetch(
      CHANNEL_IDS['DEBUG'],
    )) as TextChannel;

    this.container.logger.info(
      `Using '${this.container.mainChannel.name}' channel`,
    );

    this.container.rgd.invites
      .fetch()
      .then(console.log)
      .catch(() => console.error('no permission'));

    await this.updateChannels();
    await this.updateRoles();

    RoleBindings.list = await RoleBindings.find(true);

    this.container.logger.info('RGD fetched');

    const commitCount = execSync('git rev-list --count HEAD').toString('utf8');
    const lastCommit = execSync(
      'git log -1 --pretty=format:"%an, %s"',
    ).toString('utf8');

    const randomEmoji = this.container.rgd.emojis.cache.random();
    const content = `Bot started ${randomEmoji} \nCommit number: \`${commitCount}\` \`\`\`diff\n+ ${lastCommit}\`\`\` `;

    if (!isDev) {
      this.container.debugChannel.send({
        content,
      });
    }
  }

  private async updateChannels() {
    const channels = await this.container.rgd.channels.fetch();

    await Promise.all(
      channels.map(async (channel) => {
        if (channel) {
          let existChannel = await DiscordChannel.findOne(channel.id);
          if (!existChannel) {
            existChannel = await DiscordChannel.create({ id: channel.id });
          }
          existChannel.name = channel.name;
          existChannel.isVoice = channel.isVoice();
          existChannel.position = channel.position;

          await existChannel.save();
        }
      }),
    );
    this.container.logger.info(`${channels.size} channels updated`);
    return channels.size;
  }

  private async updateRoles() {
    const roles = await this.container.rgd.roles.fetch();

    await Promise.all(
      roles.map(async (role) => {
        let existRole = await DiscordRole.findOne(role.id);
        if (!existRole) {
          existRole = await DiscordRole.create({ id: role.id });
        }
        existRole.color = role.hexColor;
        existRole.name = role.name;
        existRole.position = role.position;
        await existRole.save();
      }),
    );

    container.logger.info(`${roles.size} roles updated`);
    return roles.size;
  }

  private styleStore(store: Store<Piece>, last: boolean) {
    return `${last ? '└─' : '├─'} Loaded ${store.size
      .toString()
      .padEnd(3, ' ')} ${store.name}`;
  }
}
