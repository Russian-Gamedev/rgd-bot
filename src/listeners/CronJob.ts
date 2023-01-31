import { StatsWeek } from '../lib/services/entities/Stats';
import { StatsDay } from '../lib/services/entities/Stats';
import { container, Events, Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import cron from 'node-cron';
import { API } from '../lib/services/directus';
import type { User } from '../lib/services/entities/User';
import { EmbedField, MessageEmbed } from 'discord.js';
import { ROLE_IDS } from '../configs/discord-constants';

@ApplyOptions<Listener.Options>({ once: true, event: Events.ClientReady })
export class ReadyListener extends Listener<typeof Events.ClientReady> {
  run() {
    cron.schedule('0 15 * * *', this.dailyCron.bind(this));
    cron.schedule('0 15 * * 6', this.weeklyCron.bind(this));
    cron.schedule('0 8 * * *', this.birthDayCron.bind(this));
    setTimeout(() => this.birthDayCron(), 1000);
  }

  private async birthDayCron() {
    const membersBirthday = await container.rgd.roles
      .fetch(ROLE_IDS.BIRTHDAY)
      .then((role) => role.members);
    for (const [, member] of membersBirthday) {
      await member.roles.remove(ROLE_IDS.BIRTHDAY);
    }

    const today = new Date()
      .toLocaleDateString('en-US', { day: '2-digit', month: '2-digit' })
      .replace('/', '-');
    const data: User[] = await API.request({
      method: 'GET',
      url: 'items/user',
      query: {
        'filter[birthDate][_ends_with]': today,
      },
    });

    const embed = new MessageEmbed();
    embed.setDescription('СЕГОДНЯШНИЕ ИМЕНИННИКИ');
    embed.setFooter('поздравьте их');

    const field: EmbedField = {
      value: '',
      name: 'и вот их список',
      inline: false,
    };

    for (const user of data) {
      const [year] = user.birthDate.split('-');
      const yearsOld = new Date().getFullYear() - Number(year);
      field.value += `<@${user.id}> сегодня празднует свое ${yearsOld} летие\n`;
      const member = await container.rgd.members.fetch(user.id);
      await member.roles.add(ROLE_IDS.BIRTHDAY);
    }

    if (field.value.length === 0) return;

    embed.setFields([field]);

    container.mainChannel.send({ embeds: [embed] });
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
