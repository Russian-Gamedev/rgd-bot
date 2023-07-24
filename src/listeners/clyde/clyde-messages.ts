import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { Events, Message } from 'discord.js';

import { CHANNEL_IDS, SERVER_ID } from '@/configs/constants';

@ApplyOptions<Listener.Options>({
  event: Events.MessageCreate,
})
export class ClydeMessages extends Listener {
  async run(message: Message) {
    if (message.guild.id != SERVER_ID) return;
    if (message.channelId != CHANNEL_IDS.AI) return;
    if (message.member.user.bot) return;
    const botId = this.container.client.id;
    if (message.mentions.has(botId)) {
      let text = message.content.replaceAll(`<@${botId}>`, '');
      if (message.reference) {
        const reference = await message.fetchReference();

        text += '\n\n' + reference.content;
      }
      await message.channel.sendTyping();

      text = await this.mentionToDisplayName(text);

      text = `${message.member.user.username} пишет: ` + text;

      const response = await this.container.clyde.send(text);
      await message.reply(response);
    }
  }

  private async mentionToDisplayName(text: string) {
    for (const mention of text.matchAll(/<@!?(?<id>\d{17,20})>/g)) {
      const [mention_ping, id] = mention;
      if (!id) continue;
      const member = await this.container.rgd.members.fetch(id);

      text = text.replaceAll(mention_ping, member.user.username);
    }
    return text;
  }
}
