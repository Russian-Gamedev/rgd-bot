import { container } from '@sapphire/pieces';
import { Client } from 'discord-user-bots';

type PromiseResolver = (value: string | PromiseLike<string>) => void;

export class ClydeBot {
  private client: Client;
  private readonly channel_id = '852644110640873512';
  private readonly clyde_id = '1081004946872352958';
  private queue: Array<PromiseResolver> = [];

  constructor(token: string) {
    this.client = new Client(token);

    this.client.on.ready = () => {
      container.logger.info('[Clyde] UserBot logged');
    };

    this.client.on.message_create = (message) => {
      if (message.channel_id != this.channel_id) return;
      if (message.author.id != this.clyde_id) return;
      const content = message.content;
      const resolve = this.queue.shift();
      if (!resolve) return;
      resolve(content);
    };
  }

  send(content: string) {
    return new Promise<string>((resolve) => {
      this.queue.push(resolve);
      content = '@Clyde ' + content;
      this.client.send(this.channel_id, { content });
    });
  }
}
