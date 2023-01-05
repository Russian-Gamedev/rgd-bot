import { StatsWeek } from '../lib/services/entities/Stats';
import { StatsDay } from '../lib/services/entities/Stats';
import { container, Events, Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import cron from 'node-cron';

@ApplyOptions<Listener.Options>({ once: true, event: Events.ClientReady })
export class ReadyListener extends Listener<typeof Events.ClientReady> {
  run() {
    cron.schedule('0 15 * * *', this.dailyCron.bind(this));
    cron.schedule('0 15 * * 6', this.weeklyCron.bind(this));
  }

  private async dailyCron() {
    const data = await StatsDay.find(true);
    this.voiceNotification(data, false);
    await Promise.all(
      data.map(async (stats) => {
        let weekUser = await StatsWeek.findOne('', {
          filter: {
            user: stats.user,
          },
        });

        if (!weekUser) {
          weekUser = await StatsWeek.create({
            user: stats.user,
          });
        }

        weekUser.chat += stats.chat;
        weekUser.voice += stats.voice;
        await weekUser.save();
        await stats.delete();
      }),
    );
    container.logger.info('daily stats cleared');
  }

  private async weeklyCron() {
    const data = await StatsWeek.find(true);
    this.voiceNotification(data, true);
    await Promise.all(data.map(async (stats) => stats.delete()));
    container.logger.info('weekly stats cleared');
  }

  private voiceNotification(data: StatsDay[] | StatsWeek[], isWeekly: boolean) {
    let chatText = '';
    let voiceText = '';
    const chatStats = data.sort((a, b) => b.chat - a.chat).slice(0, 15);
    const voiceStats = data.sort((a, b) => b.voice - a.voice).slice(0, 15);

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

    this.container.mainChannel.send({
      embeds: [
        {
          fields: [
            { name: 'стата по чату', value: chatText, inline: true },
            { name: 'стата по войсу', value: voiceText, inline: true },
            // { name: 'новорегов в базе', value: '-1', inline: false },
            {
              name: 'писало в чате',
              value: data.length.toLocaleString('ru-RU'),
              inline: false,
            },
          ],
          title: isWeekly ? 'Еженедельная статистика' : 'Ежедневная статистика',
        },
      ],
    });
  }
}
