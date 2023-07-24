import { container } from '@sapphire/pieces';
import { Client } from 'discord-user-bots';

type PromiseResolver = (value: string | PromiseLike<string>) => void;

type QueueItem = {
  id: string;
  resolve: PromiseResolver;
};

export class ClydeBot {
  private client: Client;
  private readonly channel_id = '852644110640873512';
  private readonly clyde_id = '1081004946872352958';
  private queue: Array<QueueItem> = [];

  constructor(token: string) {
    this.client = new Client(token);

    this.client.on.ready = () => {
      container.logger.info('[Clyde] UserBot logged');
    };

    this.client.on.reply = (message) => {
      if (message.channel_id != this.channel_id) return;
      if (message.author.id != this.clyde_id) return;
      const content = message.content;
      const queue = this.queue.find(
        (queue) => queue.id === message.referenced_message.id,
      );
      if (!queue) return;
      this.queue = this.queue.filter((value) => value != queue);
      queue.resolve(content);
    };
  }

  send(content: string) {
    return new Promise<string>(async (resolve) => {
      content = '@Clyde ' + content;
      const response = await this.client.send(this.channel_id, { content });
      this.queue.push({ id: response.id, resolve });
    });
  }
}
