import { ApplyOptions } from '@sapphire/decorators';
import { Events, Listener } from '@sapphire/framework';
import { Time } from '@sapphire/time-utilities';
import { GuildMember, VoiceState } from 'discord.js';

import { StatsPeriod } from '#base/entities/stats.entity';
import { StatsService } from '#base/services/stats.service';
import { UserService } from '#base/services/user.service';

@ApplyOptions<Listener.Options>({
  event: Events.VoiceStateUpdate,
})
export class MemberVoice extends Listener<typeof Events.VoiceStateUpdate> {
  get redis() {
    return this.container.redis;
  }

  onLoad() {
    super.onLoad();
    this.container.client.on('ready', () => this.onReady());
  }

  private async onReady() {
    const autoSave = async () => {
      const keys = await this.redis.keys('guild:*');
      await Promise.all(
        keys.map(async (key) => {
          const guild = await this.container.client.guilds.fetch(
            key.replace('guild:', ''),
          );

          const members = await this.redis.hGetAll(key);
          for (const member_id of Object.keys(members)) {
            const member = await guild.members.fetch(member_id);
            await this.saveTime(member);
          }
        }),
      );
    };

    await autoSave();
    setInterval(autoSave, Time.Minute * 5);
  }

  async run(oldState: VoiceState, newState: VoiceState) {
    if (newState.member.user.bot) return;
    if (oldState.channelId == newState.id) return;

    const member = newState.member;
    const guild = newState.guild;

    const key = 'guild:' + guild.id;
    const hasTime = await this.redis.hGet(key, member.id);

    if (newState.channel) {
      if (hasTime) {
        if (newState.selfDeaf) {
          await this.saveTime(member);
        }
        return;
      }
      await this.redis.hSet(key, member.id, Date.now());
    } else {
      /// left voice
      if (!hasTime) return;
      await this.saveTime(member);
    }
  }

  private async saveTime(member: GuildMember) {
    const key = 'guild:' + member.guild.id;
    const enteredTime = await this.redis.hGet(key, member.id).then(Number);
    const elapsedTime = Math.floor(
      Math.min(Date.now() - enteredTime, Time.Minute * 10) / 1_000,
    );

    const user = await UserService.Instance.get(member.guild.id, member.id);
    user.voice_time += elapsedTime ?? 0;

    UserService.Instance.database.persist(user);

    const stats = await StatsService.Instance.getByUser(
      member.guild.id,
      member.id,
      StatsPeriod.Day,
    );

    stats.voice += elapsedTime ?? 0;

    await StatsService.Instance.database.persistAndFlush(stats);

    await this.redis.hDel(key, member.id);
  }
}
