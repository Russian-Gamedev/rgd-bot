import { StatsWeek } from './../lib/services/entities/Stats';
import { StatsDay } from '../lib/services/entities/Stats';
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

    cron.schedule('0 15 * * *', async () => {
      const data = await StatsDay.find(true);
      this.voiceNotification(data, false);
      await Promise.all(
        data.map(async (stats) => {
          let week = await StatsWeek.findOne('', {
            filter: {
              user: stats.user,
            },
          });

          if (!week) {
            week = await StatsWeek.create({
              user: stats.user,
            });
          }
          week.chat += stats.chat;
          week.voice += stats.voice;

          await stats.delete();
        }),
      );
      container.logger.info('day stats cleared');
    });
    cron.schedule('0 18 * * 6', async () => {
      const data = await StatsWeek.find(true);
      this.voiceNotification(data, true);
      await Promise.all(
        data.map(async (stats) => {
          stats.delete();
        }),
      );
      container.logger.info('weekly stats cleared');
    });
  }

  private voiceNotification(data: StatsDay[] | StatsWeek[], isWeekly: boolean) {
    let chatText = '';
    let voiceText = '';
    const chatStats = data.sort((a, b) => b.chat - a.chat).slice(15);
    const voiceStats = data.sort((a, b) => b.voice - a.voice).slice(15);

    chatStats.forEach((stat, index) => {
      chatText += `${index + 1}. <@${stat.user}>: \`${stat.chat}\` \n`;
    });
    voiceStats.forEach((stat, index) => {
      const hours = Math.floor(stat.voice / 3600);
      const minutes = Math.floor((stat.voice - hours * 3600) / 60);
      voiceText += `${index + 1}. <@${
        stat.user
      }>: \`${hours} ч ${minutes} мин\` \n`;
    });

    if (!chatText) {
      chatText = 'никто не писал :(';
    }

    if (!voiceText) {
      voiceText = 'войс был пустым :(';
    }

    console.log(
      { name: 'стата по чату', value: chatText, inline: true },
      { name: 'стата по войсу', value: voiceText, inline: true },
      //{ name: 'новорегов в базе', value: '$novoregs', _inline: false },
      {
        name: 'писало в чате',
        value: data.length.toLocaleString('ru-RU'),
        inline: true,
      },
    );

    this.container.mainChannel.send({
      embeds: [
        {
          fields: [
            { name: 'стата по чату', value: chatText, inline: true },
            { name: 'стата по войсу', value: voiceText, inline: true },
            { name: 'новорегов в базе', value: '-1', inline: false },
            {
              name: 'писало в чате',
              value: data.length.toLocaleString('ru-RU'),
              inline: true,
            },
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
