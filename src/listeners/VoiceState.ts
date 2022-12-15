import { StatsDay } from './../lib/services/entities/Stats';
import { Events, Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import type { GuildMember, VoiceState } from 'discord.js';
import { User } from '../lib/services/entities/User';

@ApplyOptions<Listener.Options>({ event: Events.VoiceStateUpdate })
export class MemberBan extends Listener<typeof Events.VoiceStateUpdate> {
  private voiceMap = new Map<GuildMember, number>();

  async run(oldState: VoiceState, newState: VoiceState) {
    if (oldState.channelId == newState.id) return;

    const member = newState.member;
    if (newState.channel) {
      if (!this.voiceMap.has(member)) {
        this.voiceMap.set(member, Date.now());
        this.container.logger.info(`${member.user.username} join voice`);
      }
    } else {
      const enteredTime = this.voiceMap.get(member);
      const elapsedTime = Math.floor((Date.now() - enteredTime) / 1000);

      const user = await User.findOne(member.id);
      /// Directus return voiceTime as string, dont known why
      user.voiceTime = +user?.voiceTime + elapsedTime;
      await user.save();
      let dayStats = await StatsDay.findOne('', {
        filter: {
          user: member.id,
        },
      });
      if (!dayStats) {
        dayStats = await StatsDay.create({
          user: member.id,
        });
      }

      dayStats.voice += elapsedTime;

      await dayStats.save();

      this.voiceMap.delete(member);

      this.container.logger.info(
        `${member.user.username} leave voice`,
        elapsedTime,
      );
    }
  }
}
