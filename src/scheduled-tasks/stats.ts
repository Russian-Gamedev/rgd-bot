import { ApplyOptions } from '@sapphire/decorators';
import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';
import { EmbedBuilder } from 'discord.js';

import { Colors } from '@/configs/constants';
import { EmojiPlaces } from '@/configs/emojies';
import {
  BotStats,
  StatsDay,
  StatsKey,
  StatsWeek,
} from '@/lib/database/entities';

type Stat = { user: string; value: number };

@ApplyOptions<ScheduledTask.Options>({ pattern: '0 15 * * *' })
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
    const embed = this.buildEmbed(stats);
    embed.setTitle('Ежедневная статистика');

    const promises = stats.map(async (stat) => {
      const week = await StatsWeek.ensure(stat.user);
      week.chat += stat.chat;
      week.voice += stat.voice;
      week.reactions += stat.reactions;
      await week.save();
      await stat.remove();
    });

    await Promise.all(promises);

    await this.container.mainChannel.send({ embeds: [embed] });
  }
  private async postWeekStats() {
    const stats = await StatsWeek.find();
    if (stats.length === 0) {
      return this.container.logger.warn(`StatsWeek is empty`);
    }

    const embed = this.buildEmbed(stats);
    embed.setTitle('Еженедельная статистика');

    const promises = stats.map((stat) => stat.remove());

    await Promise.all(promises);

    await this.container.mainChannel.send({ embeds: [embed] });
  }

  private buildEmbed(stats: BotStats[]) {
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
        ({ user, value }, position) => this.buildLine(user, value, position),
        'никто не заходил в войс :(',
      ),
      inline: true,
    });

    const reactionsRaw = this.sort(stats, 'reactions');

    const lastReaction = reactionsRaw.at(-1);
    const reactions = reactionsRaw.slice(0, 15);

    if (lastReaction.value < 0) {
      reactions.push(lastReaction);
    }

    embed.addFields({
      name: 'подсчёт неплохих цифр',
      value: this.buildTop(
        reactions,
        ({ user, value }, position) =>
          this.buildLine(user, value, value >= 0 ? position : EmojiPlaces.Last),
        'никто не ставил реакций :(',
      ),
      inline: false,
    });

    embed.addFields(
      {
        name: 'новорегов в базе',
        value: (0).toString(),
        inline: false,
      },
      {
        name: 'писало в чате',
        value: stats.length.toLocaleString('ru-RU'),
        inline: false,
      },
    );

    return embed;
  }

  private buildTop(
    data: Stat[],
    buildLine: (value: Stat, position: number) => string,
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
}
