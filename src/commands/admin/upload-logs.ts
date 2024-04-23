import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { Message } from 'discord.js';

import { OWNER_ID } from '#base/config/constants';

@ApplyOptions<Command.Options>({
  name: 'logs',
  description: 'Выгрузка логов',
})
export class UploadLogCommand extends Command {
  override async messageRun(message: Message) {
    if (!OWNER_ID.includes(message.author.id)) return;

    message.channel.send({
      files: ['./debug.log'],
    });
  }
}
