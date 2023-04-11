import { DirectusApi } from '../lib/directus/directus-orm';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { container } from '@sapphire/pieces';
import { ROLE_IDS } from '../configs/discord-constants';
import { EmbedBuilder, Events, type EmbedField } from 'discord.js';
import { StatsDay, StatsWeek } from '../lib/directus/directus-entities/Stats';
import { User } from '../lib/directus/directus-entities/User';
import { FilterRule } from '../lib/directus/directus-orm/filters';
import cron from 'node-cron';

@ApplyOptions<Listener.Options>({ once: true, event: Events.ClientReady })
export class ReadyListener extends Listener<typeof Events.ClientReady> {
  run() {
    cron.schedule('0 15 * * *', this.dailyCron.bind(this));
    cron.schedule('0 15 * * 6', this.weeklyCron.bind(this));
    cron.schedule('0 8 * * *', this.birthDayCron.bind(this));
    setTimeout(() => this.birthDayCron(), 5000);
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
    const data = await User.find({
      filter: new FilterRule().EndsWith('birthDate', today),
    });

    const embed = new EmbedBuilder();
    embed.setDescription('СЕГОДНЯШНИЕ ИМЕНИННИКИ');
    embed.setFooter({ text: 'поздравьте их' });

    const field: EmbedField = {
      value: '',
      name: 'и вот их список',
      inline: false,
    };

    for (const user of data) {
      const [year] = user.birthDate.split('-');
      const yearsOld = new Date().getFullYear() - Number(year);
      field.value += `<@${user.id}> сегодня празднует свое ${yearsOld} летие\n`;
      try {
        const member = await container.rgd.members.fetch(user.id);
        await member.roles.add(ROLE_IDS.BIRTHDAY);
      } catch (e) {
        container.logger.info(user.username + ' not on server');
      }
    }

    if (field.value.length === 0) return;

    embed.setFields([field]);

    await container.mainChannel.send({ embeds: [embed] });
  }

  private async dailyCron() {
    const data = await StatsDay.find({ limit: -1 });
    const newRegs = await this.getNewRegs(false);
    this.voiceNotification(data, false, newRegs.length);
    /// Clear daily stats;
    await Promise.all(
      data.map(async (stats) => {
        let weekUser = await StatsWeek.findOne('', {
          filter: new FilterRule().EqualTo('user', stats.user),
        });

        if (!weekUser) {
          weekUser = await StatsWeek.create({
            user: stats.user,
          });
        }

        weekUser.chat += stats.chat;
        weekUser.voice += stats.voice;
        weekUser.reactions += stats.reactions;

        await weekUser.save();
        await stats.delete();
      }),
    );
    container.logger.info('daily stats cleared');
  }

  private async weeklyCron() {
    const data = await StatsWeek.find({ limit: -1 });
    const newRegs = await this.getNewRegs(true);
    this.voiceNotification(data, true, newRegs.length);
    await Promise.all(data.map(async (stats) => stats.delete()));
    container.logger.info('weekly stats cleared');
  }

  private voiceNotification(
    data: StatsDay[] | StatsWeek[],
    isWeekly: boolean,
    newRegs: number,
  ) {
    let chatText = '';
    let voiceText = '';
    let goodNumbersText = '';
    const chatStats = data.sort((a, b) => b.chat - a.chat).slice(0, 15);
    const voiceStats = data.sort((a, b) => b.voice - a.voice).slice(0, 15);
    const reactionsStats = data
      .sort((a, b) => b.reactions - a.reactions)
      .slice(0, 15);

    chatStats.forEach((stat, index) => {
      chatText += `${index + 1}. <@${stat.user}>: \`${stat.chat}\` \n`;
    });

    reactionsStats.forEach((stat, index) => {
      goodNumbersText += `${index + 1}. <@${stat.user}>: \`${
        stat.reactions
      }\` \n`;
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
    if (!goodNumbersText) {
      goodNumbersText = 'никто не кинул смешнявку :(';
    }

    this.container.mainChannel.send({
      embeds: [
        {
          fields: [
            { name: 'стата по чату', value: chatText, inline: true },
            { name: 'стата по войсу', value: voiceText, inline: true },
            {
              name: 'подсчёт неплохих цифр',
              value: goodNumbersText,
              inline: false,
            },
            {
              name: 'новорегов в базе',
              value: newRegs.toString(),
              inline: false,
            },
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

  private async getNewRegs(weekly: boolean): Promise<User[]> {
    const period = weekly ? 'week' : 'day';
    const data = await DirectusApi.instance.request({
      url: 'items/user',
      method: 'GET',
      query: {
        filter: new FilterRule().GreaterThanOrEqualTo(
          'firstJoin',
          `$NOW(-1 ${period})`,
        ),
      },
    });
    return data || [];
  }
}
