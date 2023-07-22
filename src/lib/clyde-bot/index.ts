import { container } from '@sapphire/pieces';
import { Client } from 'discord-user-bots';

type PromiseResolver = (value: string | PromiseLike<string>) => void;

export class ClydeBot {
  private client: Client;
  private readonly clyde_id = '1132385202551914597';
  private queue: Array<PromiseResolver> = [];

  constructor(token: string) {
    this.client = new Client(token);

    this.client.on.ready = () => {
      container.logger.info('[Clyde] UserBot logged');
    };

    this.client.on.message_create = (message) => {
      if (message.author.username != 'clyde') return;
      const content = message.content;
      const resolve = this.queue.shift();
      if (!resolve) return;
      resolve(content);
    };
  }

  send(content: string) {
    return new Promise<string>((resolve) => {
      this.queue.push(resolve);
      this.client.send(this.clyde_id, { content });
    });
  }
}
