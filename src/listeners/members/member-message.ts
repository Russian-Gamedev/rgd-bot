import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { Message } from 'discord.js';

import { StatsPeriod } from '#base/entities/stats.entity';
import { StatsService } from '#base/services/stats.service';
import { UserService } from '#base/services/user.service';
import { RGD_ID } from '#config/constants';

@ApplyOptions<Listener.Options>({
  event: Events.MessageCreate,
})
export class MemberMessage extends Listener<typeof Events.MessageCreate> {
  get userService() {
    return UserService.Instance;
  }

  get statsService() {
    return StatsService.Instance;
  }

  async run(message: Message) {
    if (message.guild.id !== RGD_ID) return;
    if (message.webhookId) return;
    if (message.member.user.bot) return;

    const words = message.content.split(' ').filter((word) => word.length);
    if (words.length === 0) return;

    const user = await this.userService.get(message.member.id);

    user.experience += words.length;

    this.userService.database.persist(user);

    const daysStats = await this.statsService.getByUser(
      message.member.id,
      StatsPeriod.Day,
    );

    daysStats.chat += words.length;

    await this.statsService.database.persistAndFlush(daysStats);
  }
}
