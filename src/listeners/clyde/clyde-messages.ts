import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { Events, Message } from 'discord.js';

@ApplyOptions<Listener.Options>({
  event: Events.MessageCreate,
})
export class ClydeMessages extends Listener {
  async run(message: Message) {
    if (message.member.user.bot) return;
    const botId = this.container.client.id;
    if (message.mentions.has(botId)) {
      let text = message.content.replaceAll(`<@${botId}>`, '');
      if (message.reference) {
        const reference = await message.fetchReference();

        text += '\n\n' + reference.content;
      }
      await message.channel.sendTyping();
      const response = await this.container.clyde.send(text);
      await message.reply(response);
    }
  }
}
