import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  Client,
  EmbedBuilder,
  Guild,
  InteractionContextType,
} from 'discord.js';
import { Context, SlashCommand, type SlashCommandContext } from 'necord';

import { Colors } from '#config/constants';
import { GuildSettings } from '#config/guilds';
import { GuildSettingsService } from '#core/guilds/settings/guild-settings.service';
import { UserEntity } from '#core/users/entities/user.entity';
import { UserService } from '#core/users/users.service';
import { formatTime, pickRandom } from '#root/lib/utils';

import { ActivityEntity, ActivityPeriod } from './entities/activity.entity';

@Injectable()
export class ActivityJobService {
  private readonly logger = new Logger(ActivityJobService.name);

  constructor(
    @InjectRepository(ActivityEntity)
    private readonly activityRepository: EntityRepository<ActivityEntity>,
    private readonly em: EntityManager,
    private readonly discord: Client,
    private readonly userService: UserService,
    private readonly guildSettings: GuildSettingsService,
  ) {}

  @SlashCommand({
    name: 'activity',
    description: 'Показать ежедневную активность на сервере',
    contexts: [InteractionContextType.Guild],
  })
  async activityCommand(@Context() [interaction]: SlashCommandContext) {
    if (!interaction.guild) return;

    const period = ActivityPeriod.Day;

    const activities = await this.activityRepository.find({
      guild_id: BigInt(interaction.guild.id),
      period,
    });

    const embed = await this.buildEmbed(activities, period);

    await interaction.reply({ embeds: [embed] });
  }

  @Cron('0 15 * * *', { timeZone: 'Europe/Moscow' })
  async handleDailyJob() {
    /// Runs every day at 15:00 MSK
    this.logger.log('Running daily activity job');

    const guilds = await this.discord.guilds.fetch();
    for (const { id } of guilds.values()) {
      const guild = await this.discord.guilds.fetch(id);

      await this.calculateDailyActivity(guild);
      await this.giveAwayDailyCoins(guild);

      await this.postActivitySummary(guild, ActivityPeriod.Day);
      await this.moveToNextPeriod(guild, ActivityPeriod.Day);
      const today = new Date();

      const isSaturday = today.getDay() === 6;

      if (isSaturday) {
        await this.postActivitySummary(guild, ActivityPeriod.Week);
        await this.moveToNextPeriod(guild, ActivityPeriod.Week);
      }

      const isLastDayOfMonth =
        new Date(today.getTime() + 1_000 * 60 * 60 * 24).getDate() === 1;

      if (isLastDayOfMonth) {
        await this.postActivitySummary(guild, ActivityPeriod.Month);
        await this.moveToNextPeriod(guild, ActivityPeriod.Month);
      }
    }
  }

  private async giveAwayDailyCoins(guild: Guild) {
    const activities = await this.activityRepository.find({
      guild_id: BigInt(guild.id),
      period: ActivityPeriod.Day,
    });

    for (const activity of activities) {
      const coinsPerMinute = Math.floor(activity.voice / 60);
      const coins = activity.message + coinsPerMinute;
      if (coins === 0) continue;
      const user = await this.userService.findOrCreate(
        BigInt(guild.id),
        activity.user_id,
      );
      await this.userService.addCoins(user, coins);
    }
  }

  private async calculateDailyActivity(guild: Guild) {
    const activeRole = await this.guildSettings.getActiveRole(guild.id);
    const enabledAutoRole = await this.guildSettings.getSetting<boolean>(
      BigInt(guild.id),
      GuildSettings.ActiveAutoGiveRole,
    );
    const activeRoleThreshold = await this.guildSettings.getSetting<number>(
      BigInt(guild.id),
      GuildSettings.ActiveAutoGiveRoleThreshold,
      7,
    );
    const activeRemoveThreshold = await this.guildSettings.getSetting<number>(
      BigInt(guild.id),
      GuildSettings.ActiveAutoRemoveRoleThreshold,
      30,
    );

    const activities = await this.activityRepository.find({
      guild_id: BigInt(guild.id),
      period: ActivityPeriod.Day,
    });

    const activeUsers: bigint[] = [];

    for (const activity of activities) {
      const MESSAGE_THRESHOLD = 25;
      const VOICE_THRESHOLD = 60 * 30; // in seconds
      if (
        activity.message > MESSAGE_THRESHOLD ||
        activity.voice > VOICE_THRESHOLD
      ) {
        activeUsers.push(activity.user_id);
      }
    }

    this.logger.log(
      `Guild ${guild.id} - Active users today: ${activeUsers.length}`,
    );

    /// reset streaks for inactive users
    await this.em.nativeUpdate(
      UserEntity,
      {
        user_id: { $nin: activeUsers as unknown as number[] },
        guild_id: BigInt(guild.id),
      },
      {
        activeStreak: 0,
      },
    );

    const checkAutoRole = enabledAutoRole && activeRole;

    // increase streaks for active users
    for (const userId of activeUsers) {
      const user = await this.userService.findOrCreate(guild.id, userId);
      await this.userService.increaseActiveStreak(user);
      if (!checkAutoRole) continue;

      if (user.activeStreak >= activeRoleThreshold!) {
        this.logger.log(
          `User ${user.user_id} in guild ${guild.id} has an active streak of ${user.activeStreak} days!`,
        );

        await this.userService.giveRoleToUser(user, activeRole.id);
      }
    }

    for (const member of activeRole?.members ?? []) {
      const userId = BigInt(member[0]);
      const user = await this.userService.findOrCreate(guild.id, userId);
      if (!checkAutoRole) continue;
      if (
        Date.now() - user.lastActiveAt?.getTime() >
        activeRemoveThreshold! * 24 * 60 * 60 * 1000
      ) {
        this.logger.log(
          `Removing active role from user ${user.user_id} in guild ${guild.id} due to inactivity`,
        );
        await this.userService.removeRoleFromUser(user, activeRole.id);
      }
    }
  }

  private async postActivitySummary(guild: Guild, period: ActivityPeriod) {
    const activities = await this.activityRepository.find({
      guild_id: BigInt(guild.id),
      period,
    });

    if (activities.length === 0) {
      this.logger.log(
        `No activity data for guild ${guild.id} and period ${period}`,
      );
      return;
    }

    const channelId = await this.guildSettings.getSetting<string>(
      BigInt(guild.id),
      GuildSettings.EventMessageChannel,
    );

    if (!channelId) return;

    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel?.isSendable()) return;

    const embed = await this.buildEmbed(activities, period);

    await channel.send({ embeds: [embed] });
  }

  private async buildEmbed(
    activities: ActivityEntity[],
    period: ActivityPeriod,
  ) {
    const date = new Date();
    let days = 1;
    if (period === ActivityPeriod.Week) days = 7;
    if (period === ActivityPeriod.Month) days = 30;
    date.setTime(date.getTime() - days * 1_000 * 60 * 60 * 24);

    const guildId = activities[0]?.guild_id;
    const newRegs = await this.userService.getNewUsers(date, guildId);
    const usersStreak = await this.userService.getTopUsersByField(
      guildId,
      'activeStreak',
      15,
    );

    const embed = new EmbedBuilder();

    const title = {
      [ActivityPeriod.Day]: 'Ежедневная статистика',
      [ActivityPeriod.Week]: 'Еженедельная статистика',
      [ActivityPeriod.Month]: 'Ежемесячная статистика',
    }[period];

    embed.setTitle(title);

    const sort = (
      data: ActivityEntity[],
      key: keyof Pick<ActivityEntity, 'voice' | 'message' | 'reactions'>,
    ) =>
      data
        .sort((a, b) => b[key] - a[key])
        .map((value) => ({ user: value.user_id, value: value[key] }))
        .slice(0, 15)
        .filter((a) => a.value > 0);

    const buildLine = (
      userId: bigint,
      value: number | string,
      rank: number | string,
    ) => {
      const userTag = `<@${userId.toString()}>`;
      return `${rank}. ${userTag}: \`${value}\`\n`;
    };

    const buildTop = <T>(
      data: T[],
      buildLine: (item: T, rank: number) => string,
      emptyText: string,
    ) => {
      let text = data.reduce(
        (acc, item, index) => acc + buildLine(item, index + 1),
        '',
      );
      if (text === '') text = emptyText;
      return text;
    };

    const topVoice = buildTop(
      sort(activities, 'voice'),
      (item, rank) => buildLine(item.user, formatTime(item.value), rank),
      'никто не заходил в войс :(',
    );

    const topMessages = buildTop(
      sort(activities, 'message'),
      (item, rank) => buildLine(item.user, item.value, rank),
      'никто не писал :(',
    );

    const reactionsRaw = activities.sort((a, b) => b.reactions - a.reactions);

    const lastReactions = reactionsRaw.at(-1);
    const reactions = reactionsRaw.filter((a) => a.reactions > 0).slice(0, 15);

    /// shit code to always show the last user in the list
    if (
      Number(lastReactions?.reactions) < 0 ||
      (Number(reactions.at(-1)?.reactions) < 0 &&
        reactions.at(-1)?.reactions !== lastReactions?.reactions)
    ) {
      reactions.push(lastReactions!);
    }

    const randomClownEmoji = pickRandom([
      '🤡',
      '<:poel:874759751043514379>',
      '<:clown:965322944731570266>',
      '<:kolyatrap:746270313112928257>',
      '<:mdnt:1121918483010171033>',
    ]);

    const topReactions = buildTop(
      reactions,
      (item, rank) =>
        buildLine(
          item.user_id,
          item.reactions,
          item.reactions >= 0 ? rank : randomClownEmoji,
        ),
      'никто не реагировал :(',
    );

    const topNewRegs = buildTop(
      newRegs.slice(0, 15),
      (item, rank) => `${rank}. <@${item.user_id}>\n`,
      'никто не пришел к нам :(',
    );

    const totalActives = activities.length.toLocaleString('ru-RU');

    const topStreaks = buildTop(
      usersStreak,
      (item, rank) =>
        buildLine(item.user_id, `${item.activeStreak} дней`, rank),
      'никто не держит активную серию :(',
    );

    embed.addFields(
      { name: 'Стата по войсу', value: topVoice, inline: true },
      { name: 'Стата по чату', value: topMessages, inline: true },
      { name: '\u200b', value: '\u200b' },
      { name: 'Подсчёт неплохих цифр', value: topReactions, inline: true },
      { name: 'Новореги', value: topNewRegs, inline: true },
      { name: '\u200b', value: '\u200b' },
      { name: 'Активные пользователи', value: topStreaks, inline: true },
      { name: 'Писало в чате', value: totalActives, inline: false },
    );

    embed.setColor(Colors.Primary);

    return embed;
  }

  private async moveToNextPeriod(guild: Guild, period: ActivityPeriod) {
    const nextPeriod = this.getNextPeriod(period);

    this.logger.log(`Moving activity from ${period} to ${nextPeriod}`);

    const activities = await this.activityRepository.find({
      period,
      guild_id: BigInt(guild.id),
    });

    if (nextPeriod) {
      for (const activity of activities) {
        const nextActivity = await this.getOrCreateActivity(
          activity.guild_id,
          activity.user_id,
          nextPeriod,
        );
        nextActivity.message += activity.message;
        nextActivity.voice += activity.voice;
        nextActivity.reactions += activity.reactions;

        await this.em.persistAndFlush(nextActivity);
      }
    }

    await this.activityRepository.nativeDelete({
      period,
      guild_id: BigInt(guild.id),
    });
  }

  private async getOrCreateActivity(
    guildId: bigint,
    userId: bigint,
    period: ActivityPeriod,
  ) {
    let activity = await this.activityRepository.findOne({
      guild_id: guildId,
      user_id: userId,
      period,
    });

    if (!activity) {
      activity = new ActivityEntity();
      activity.guild_id = guildId;
      activity.user_id = userId;
      activity.period = period;
      await this.em.persistAndFlush(activity);
    }

    return activity;
  }

  private getNextPeriod(period: ActivityPeriod) {
    switch (period) {
      case ActivityPeriod.Day:
        return ActivityPeriod.Week;
      case ActivityPeriod.Week:
        return ActivityPeriod.Month;
      default:
        return null;
    }
  }
}
