import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { container } from '@sapphire/pieces';
import { EmbedBuilder, Events } from 'discord.js';
import {
  type Stats,
  StatsDay,
  StatsWeek,
} from '@/lib/directus/directus-entities/Stats';
import { User } from '@/lib/directus/directus-entities/User';
import { FilterRule } from '@/lib/directus/directus-orm/filters';
import cron from 'node-cron';
import { DirectusApi } from '@/lib/directus/directus-orm';

@ApplyOptions<Listener.Options>({ once: true, event: Events.ClientReady })
export class ReadyListener extends Listener<typeof Events.ClientReady> {
  run() {
    cron.schedule('0 15 * * *', this.dailyCron.bind(this));
    cron.schedule('0 15 * * 6', this.weeklyCron.bind(this));
  }

  private async dailyCron() {
    const data = await StatsDay.find({ limit: -1 });
    const newRegs = await this.getNewRegs('day');
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
    const newRegs = await this.getNewRegs('week');
    this.voiceNotification(data, true, newRegs.length);
    await Promise.all(data.map(async (stats) => stats.delete()));
    container.logger.info('weekly stats cleared');
  }

  private processText(data: Stats[], embed: EmbedBuilder) {
    let chatText = '';
    const chatStats = data.sort((a, b) => b.chat - a.chat).slice(0, 15);
    chatStats.forEach((stat, index) => {
      chatText += `${index + 1}. <@${stat.user}>: \`${stat.chat}\` \n`;
    });
    if (!chatText) {
      chatText = 'никто не писал :(';
    }
    embed.addFields({ name: 'стата по чату', value: chatText, inline: true });
  }

  private processVoice(data: Stats[], embed: EmbedBuilder) {
    let voiceText = '';
    const voiceStats = data.sort((a, b) => b.voice - a.voice).slice(0, 15);
    voiceStats.forEach((stat, index) => {
      const hours = Math.floor(stat.voice / 3600);
      const minutes = Math.floor((stat.voice - hours * 3600) / 60);
      voiceText += `${index + 1}. <@${
        stat.user
      }>: \`${hours} ч ${minutes} мин\` \n`;
    });

    if (!voiceText) {
      voiceText = 'войс был пустым :(';
    }

    embed.addFields({ name: 'стата по войсу', value: voiceText, inline: true });
  }

  private processGoodNumbers(data: Stats[], embed: EmbedBuilder) {
    let goodNumbersText = '';

    let reactionsStats = data.sort((a, b) => b.reactions - a.reactions);

    const last = reactionsStats.at(-1);

    reactionsStats = reactionsStats.slice(0, 14);
    reactionsStats.push(last);

    reactionsStats.forEach((stat, index) => {
      goodNumbersText += `${index + 1}. <@${stat.user}>: \`${
        stat.reactions
      }\` \n`;
    });

    if (!goodNumbersText) {
      goodNumbersText = 'никто не кинул смешнявку :(';
    }

    embed.addFields({
      name: 'подсчёт неплохих цифр',
      value: goodNumbersText,
      inline: false,
    });
  }

  private voiceNotification(data: Stats[], isWeekly: boolean, newRegs: number) {
    const processes = [
      this.processText,
      this.processVoice,
      this.processGoodNumbers,
    ];

    const embed = new EmbedBuilder();
    embed.setTitle(
      isWeekly ? 'Еженедельная статистика' : 'Ежедневная статистика',
    );

    for (const process of processes) {
      process(data, embed);
    }

    embed.addFields({
      name: 'новорегов в базе',
      value: newRegs.toString(),
      inline: false,
    });

    embed.addFields({
      name: 'писало в чате',
      value: data.length.toLocaleString('ru-RU'),
      inline: false,
    });

    this.container.mainChannel.send({
      embeds: [embed],
    });
  }

  private async getNewRegs(period: 'week' | 'day'): Promise<User[]> {
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
