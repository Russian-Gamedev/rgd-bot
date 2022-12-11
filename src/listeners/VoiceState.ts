import { Events, Listener } from '@sapphire/framework';
import { ApplyOptions } from '@sapphire/decorators';
import type { GuildMember, VoiceState } from 'discord.js';

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

      const user = await this.container.api.getUser(member.id);
      /// Directus return voiceTime as string, dont known why
      user.voiceTime = +user.voiceTime + elapsedTime;
      await this.container.api.updateUser(user);
      const session = await this.container.api.getSession();

      if (!(member.id in session.voiceTimeOfDay)) {
        session.voiceTimeOfDay[member.id] = 0;
      }

      if (!(member.id in session.voiceTimeOfWeek)) {
        session.voiceTimeOfWeek[member.id] = 0;
      }

      session.voiceTimeOfDay[member.id] += elapsedTime;
      session.voiceTimeOfWeek[member.id] += elapsedTime;

      await this.container.api.saveSession(session);

      this.voiceMap.delete(member);

      this.container.logger.info(
        `${member.user.username} leave voice`,
        elapsedTime,
      );
    }
  }
}
