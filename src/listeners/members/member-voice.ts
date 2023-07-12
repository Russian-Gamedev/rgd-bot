import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { Events, GuildMember, VoiceState } from 'discord.js';

import { User } from '@/lib/database/entities';
import { StatsDay } from '@/lib/database/entities/stats/StatsEntity';
import { Times } from '@/lib/utils';

@ApplyOptions<Listener.Options>({
  event: Events.VoiceStateUpdate,
})
export class MemberVoice extends Listener {
  private voiceMap = new Map<GuildMember, number>();

  override onLoad() {
    super.onLoad();
    this.container.client.on('ready', () => this.onReady());
  }

  async run(oldState: VoiceState, newState: VoiceState) {
    if (newState.member.user.bot) return;
    if (oldState.channelId == newState.id) return;
    const member = newState.member;

    if (newState.channel) {
      if (this.voiceMap.has(member)) return;

      this.voiceMap.set(member, Date.now());
      this.container.logger.info(`${member.user.username} join voice`);
    } else {
      if (!this.voiceMap.has(member)) return;

      await this.calcVoice(member);
      this.container.logger.info(`${member.user.username} left voice`);
    }
  }

  private async onReady() {
    setInterval(
      async () => {
        const members = [...this.voiceMap.keys()];

        for (const member of members) {
          await this.calcVoice(member);
          this.voiceMap.set(member, Date.now());
        }
      },
      1_000 * Times.Minutes * 5,
    );
  }

  private async calcVoice(member: GuildMember) {
    const enteredTime = this.voiceMap.get(member);
    const elapsedTime = Math.floor((Date.now() - enteredTime) / 1_000);

    const user = await User.ensure(member);

    user.voiceTime += elapsedTime;
    await user.save();

    const stats = await StatsDay.ensure(member.id);

    stats.voice += elapsedTime;

    await stats.save();

    this.voiceMap.delete(member);
  }
}
