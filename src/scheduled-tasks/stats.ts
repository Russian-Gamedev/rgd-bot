// import { ApplyOptions } from '@sapphire/decorators';
// import { ScheduledTask } from '@sapphire/plugin-scheduled-tasks';
// import { Time } from '@sapphire/time-utilities';
// import { EmbedBuilder, Guild, TextChannel } from 'discord.js';

// import { StatsEntity, StatsPeriod } from '#base/entities/stats.entity';
// import { UserEntity } from '#base/entities/user.entity';
// import { GuildSettingService } from '#base/services/guild-setting.service';
// import { StatsService } from '#base/services/stats.service';
// import { UserService } from '#base/services/user.service';
// import { Colors, GuildSettings } from '#config/constants';
// import { formatTime, getTimeInfo, pickRandom } from '#lib/utils';

// @ApplyOptions<ScheduledTask.Options>({
//   pattern: '0 15 * * *',
//   name: 'post-stats-task',
//   timezone: 'Europe/Moscow',
// })
// export class StatsTask extends ScheduledTask {
//   get statsService() {
//     return StatsService.Instance;
//   }

//   get settingsService() {
//     return GuildSettingService.Instance;
//   }

//   get userService() {
//     return UserService.Instance;
//   }

//   async run() {
//     const guilds = await this.container.client.guilds.fetch();

//     for (const { id } of guilds.values()) {
//       const guild = await this.container.client.guilds.fetch(id);
//       await this.postStats(guild, StatsPeriod.Day);

//       const today = new Date();
//       const isSaturday = today.getDay() === 6;

//       if (isSaturday) {
//         await this.postStats(guild, StatsPeriod.Week);
//       }

//       const isLastDayOfMonth =
//         new Date(today.getTime() + Time.Day).getDate() === 1;

//       if (isLastDayOfMonth) {
//         await this.postStats(guild, StatsPeriod.Month);
//       }
//     }
//   }

//   private async postStats(guild: Guild, period: StatsPeriod) {
//     const stats = await this.statsService.getAllByPeriod(guild.id, period);

//     const postMessageStats = await this.settingsService.get(
//       guild.id,
//       GuildSettings.StatsMessage,
//       'false',
//     );

//     if (postMessageStats === 'true') {
//       const channel_id = await this.settingsService.get(
//         guild.id,
//         GuildSettings.SystemChannel,
//         guild.systemChannelId,
//       );

//       const channel = (await guild.channels.fetch(channel_id)) as TextChannel;

//       const newRegs = await this.statsService.getNewRegs(guild.id, period);

//       const embed = this.buildEmbed(stats, newRegs.slice(0, 15));

//       const title = {
//         [StatsPeriod.Day]: 'Ежедневная статистика',
//         [StatsPeriod.Week]: 'Еженедельная статистика',
//         [StatsPeriod.Month]: 'Ежемесячная статистика',
//       }[period];

//       embed.setTitle(title);

//       await channel.send({ embeds: [embed] });
//     }

//     if (period === StatsPeriod.Day) {
//       /// give bonuses
//       await Promise.all(
//         stats.map(async (stats) => {
//           const hours = getTimeInfo(stats.voice).hours;
//           const coins = stats.chat + hours * 100 + stats.reactions * 50;
//           const user = await this.userService.get(guild.id, stats.user_id);
//           user.coins += coins;
//           this.userService.database.persist(user);
//         }),
//       );

//       await this.userService.database.flush();
//     }

//     const nextPeriod = this.getNextPeriod(period);
//     if (nextPeriod) {
//       await this.statsService.mergeStats(stats, nextPeriod);
//     }

//     await this.statsService.database.nativeDelete(StatsEntity, {
//       period,
//     });

//     await this.statsService.database.flush();
//   }

//   private buildEmbed(stats: StatsEntity[], newRegs: UserEntity[]) {
//     const embed = new EmbedBuilder();
//     embed.setColor(Colors.Primary);

//     embed.addFields({
//       name: 'стата по чату',
//       value: this.buildTop(
//         this.sort(stats, 'chat')
//           .slice(0, 15)
//           .filter((stat) => stat.value > 0),
//         ({ user, value }, position) => this.buildLine(user, value, position),
//         'никто не писал :(',
//       ),
//       inline: true,
//     });
//     embed.addFields({
//       name: 'стата по войсу',
//       value: this.buildTop(
//         this.sort(stats, 'voice')
//           .slice(0, 15)
//           .filter((stat) => stat.value > 0),
//         ({ user, value }, position) => {
//           return this.buildLine(user, formatTime(value), position);
//         },
//         'никто не заходил в войс :(',
//       ),
//       inline: true,
//     });

//     const reactionsRaw = this.sort(stats, 'reactions');

//     const lastReaction = reactionsRaw.at(-1);
//     const reactions = reactionsRaw
//       .slice(0, 15)
//       .filter((stat) => stat.value !== 0);

//     if (
//       lastReaction.value < 0 ||
//       (reactions.at(-1)?.value < 0 && reactions.at(-1) != lastReaction)
//     ) {
//       reactions.push(lastReaction);
//     }

//     embed.addFields({ name: '\u200b', value: '\u200b' });

//     const randomLastEmoji = pickRandom([
//       '🤡',
//       '<:poel:874759751043514379>',
//       '<:clown:965322944731570266>',
//       '<:kolyatrap:746270313112928257>',
//       '<:mdnt:1121918483010171033>',
//     ]);

//     embed.addFields({
//       name: 'подсчёт неплохих цифр',
//       value: this.buildTop(
//         reactions,
//         ({ user, value }, position) =>
//           this.buildLine(user, value, value >= 0 ? position : randomLastEmoji),
//         'никто не ставил реакций :(',
//       ),
//       inline: true,
//     });

//     embed.addFields({
//       name: 'новореги',
//       value: this.buildTop(
//         newRegs,
//         (user, i) => `${i}. <@${user.user_id}>\n`,
//         'никто не пришел к нам :(',
//       ),
//       inline: true,
//     });

//     embed.addFields({
//       name: 'писало в чате',
//       value: stats.length.toLocaleString('ru-RU'),
//       inline: false,
//     });

//     return embed;
//   }

//   private buildTop<T>(
//     data: T[],
//     buildLine: (value: T, position: number) => string,
//     emptyText: string,
//   ) {
//     let text = data.reduce(
//       (text, value, index) => text + buildLine(value, index + 1),
//       '',
//     );
//     if (text === '') text = emptyText;

//     return text;
//   }

//   private buildLine(
//     user: string,
//     value: string | number,
//     position: string | number,
//   ) {
//     return `${position}. <@${user}>: \`${value}\`\n`;
//   }

//   private sort(
//     data: StatsEntity[],
//     key: keyof Pick<StatsEntity, 'chat' | 'voice' | 'reactions'>,
//   ) {
//     return data
//       .sort((a, b) => b[key] - a[key])
//       .map((stats) => ({ user: stats.user_id, value: stats[key] }));
//   }

//   private getNextPeriod(period: StatsPeriod) {
//     switch (period) {
//       case StatsPeriod.Day:
//         return StatsPeriod.Week;
//       case StatsPeriod.Week:
//         return StatsPeriod.Month;
//     }
//     return null;
//   }
// }
