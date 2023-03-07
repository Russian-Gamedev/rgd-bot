import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { Events, type Message } from 'discord.js';
import { khaleesiGenerate } from '../lib/khaleesi';

@ApplyOptions<Listener.Options>({ event: Events.MessageCreate })
export class MemberLeave extends Listener<typeof Events.MessageCreate> {
  async run(message: Message) {
    if (message.member.user.bot) return;
    const botId = this.container.client.id;

    if (message.mentions.has(botId)) {
      const text = message.content.replaceAll(`<@${botId}>`, '');
      message.channel.send(khaleesiGenerate(text));
    }
  }
}
