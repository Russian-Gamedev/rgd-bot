import { ApplyOptions } from '@sapphire/decorators';
import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';
import { Time } from '@sapphire/time-utilities';
import { EmbedBuilder } from 'discord.js';
import { MoreThan } from 'typeorm';

import { Colors } from '@/configs/constants';
import { EmojiMedals } from '@/configs/emojies';
import {
  BotStats,
  StatsDay,
  StatsKey,
  StatsWeek,
  User,
} from '@/lib/database/entities';
import { formatTime } from '@/lib/utils';

type Stat = { user: string; value: number };

@ApplyOptions<ScheduledTask.Options>({
  pattern: '0 15 * * *',
  name: 'post-stats-task',
})
export class StatsTask extends ScheduledTask {
  async run() {
    await this.postDayStats();
    const today = new Date().getDay();
    if (today === 6) {
      await this.postWeekStats();
    }
  }

  private async postDayStats() {
    const stats = await StatsDay.find();
    if (stats.length === 0) {
      return this.container.logger.warn(`StatsDay is empty`);
    }
    const newRegs = await this.getNewRegs(1);
    const embed = this.buildEmbed(stats, newRegs);
    embed.setTitle('Ежедневная статистика');

    const promises = stats.map(async (stat) => {
      const week = await StatsWeek.ensure(stat.user);
      week.chat += stat.chat;
      week.voice += stat.voice;
      week.reactions += stat.reactions;

      const user = await User.findOne({ where: { id: stat.user } });
      user.coins += stat.reactions;

      await Promise.all([user.save(), week.save(), stat.remove()]);
    });

    await Promise.all(promises);

    await this.container.mainChannel.send({ embeds: [embed] });
  }

  private async postWeekStats() {
    const stats = await StatsWeek.find();
    if (stats.length === 0) {
      return this.container.logger.warn(`StatsWeek is empty`);
    }
    const newRegs = await this.getNewRegs(7);
    const embed = this.buildEmbed(stats, newRegs);
    embed.setTitle('Еженедельная статистика');

    const promises = stats.map((stat) => stat.remove());

    await Promise.all(promises);

    await this.container.mainChannel.send({ embeds: [embed] });
  }

  private buildEmbed(stats: BotStats[], newRegs: User[]) {
    const embed = new EmbedBuilder();
    embed.setColor(Colors.Primary);

    embed.addFields({
      name: 'стата по чату',
      value: this.buildTop(
        this.sort(stats, 'chat').slice(0, 15),
        ({ user, value }, position) => this.buildLine(user, value, position),
        'никто не писал :(',
      ),
      inline: true,
    });
    embed.addFields({
      name: 'стата по войсу',
      value: this.buildTop(
        this.sort(stats, 'voice').slice(0, 15),
        ({ user, value }, position) => {
          return this.buildLine(user, formatTime(value), position);
        },
        'никто не заходил в войс :(',
      ),
      inline: true,
    });

    const reactionsRaw = this.sort(stats, 'reactions');

    const lastReaction = reactionsRaw.at(-1);
    const reactions = reactionsRaw.slice(0, 15);

    if (lastReaction.value < 0 || reactions.at(-1) != lastReaction) {
      reactions.push(lastReaction);
    }

    embed.addFields({ name: '\u200b', value: '\u200b' });

    embed.addFields({
      name: 'подсчёт неплохих цифр',
      value: this.buildTop(
        reactions,
        ({ user, value }, position) =>
          this.buildLine(user, value, value >= 0 ? position : EmojiMedals.Last),
        'никто не ставил реакций :(',
      ),
      inline: true,
    });

    embed.addFields({
      name: 'новореги',
      value: this.buildTop(
        newRegs,
        (user, i) => `${i}. <@${user.id}>\n`,
        'никто не пришел к нам :(',
      ),
      inline: true,
    });

    embed.addFields({
      name: 'писало в чате',
      value: stats.length.toLocaleString('ru-RU'),
      inline: false,
    });

    return embed;
  }

  private buildTop<T>(
    data: T[],
    buildLine: (value: T, position: number) => string,
    emptyText: string,
  ) {
    let text = data.reduce(
      (text, value, index) => text + buildLine(value, index + 1),
      '',
    );
    if (text === '') text = emptyText;

    return text;
  }

  private buildLine(
    user: string,
    value: string | number,
    position: string | number,
  ) {
    return `${position}. <@${user}>: \`${value}\`\n`;
  }

  private sort(data: BotStats[], key: StatsKey): Stat[] {
    return data
      .sort((a, b) => b[key] - a[key])
      .map((stats) => ({ user: stats.user, value: stats[key] }));
  }

  private async getNewRegs(days: number) {
    const time = new Date();
    time.setTime(time.getTime() - Time.Day * days);
    return await User.find({
      where: { firstJoin: MoreThan(time), leave: false },
    });
  }
}
