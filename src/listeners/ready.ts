import type { TextChannel } from 'discord.js';
import { container, Events, Listener, Piece, Store } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import { CHANNEL_IDS, SERVER_ID } from '../configs/discord-constants';
import cron from 'node-cron';

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

    cron.schedule('0 18 * * *', async () => {
      const data = await this.container.api.getSession();
      this.voiceNotification(data.voiceTimeOfDay, false);
      data.voiceTimeOfDay = {};
      await this.container.api.saveSession(data);
    });
    cron.schedule('0 18 * * 6', async () => {
      const data = await this.container.api.getSession();
      this.voiceNotification(data.voiceTimeOfWeek, true);
      data.voiceTimeOfWeek = {};
      await this.container.api.saveSession(data);
    });
  }

  private voiceNotification(data: Record<string, number>, isWeekly: boolean) {
    let text = '';
    const stats = Object.entries(data);
    stats.sort((a, b) => b[1] - a[1]);
    stats.slice(15);

    stats.forEach(([member, time], index) => {
      text += `${index + 1}. <@${member}>: \`${time}\` \n`;
    });

    this.container.mainChannel.send({
      embeds: [
        {
          fields: [
            //{ name: 'стата по чату', value: cc, _inline: true },
            { name: 'стата по войсу', value: text, inline: true },
            //{ name: 'новорегов в базе', value: '$novoregs', _inline: false },
            //{ name: 'писало в чате', value: '$activs', _inline: true },
          ],
          title: isWeekly ? 'Еженедельная статистика' : 'Ежедневная статистика',
        },
      ],
    });
  }

  private async getRgdGuild() {
    this.container.rgd = await this.container.client.guilds.fetch(SERVER_ID);

    const isDev = process.env.NODE_ENV === 'development';

    this.container.mainChannel = (await this.container.rgd.channels.fetch(
      CHANNEL_IDS[isDev ? 'DEBUG' : 'MAIN'],
    )) as TextChannel;

    this.container.logger.info(
      `Using '${this.container.mainChannel.name}' channel`,
    );
    this.container.logger.info('RGD fetched');
  }

  private styleStore(store: Store<Piece>, last: boolean) {
    return `${last ? '└─' : '├─'} Loaded ${store.size
      .toString()
      .padEnd(3, ' ')} ${store.name}`;
  }
}
