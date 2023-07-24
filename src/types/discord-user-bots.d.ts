declare module 'discord-user-bots' {
  export interface ClientEvents {
    message_create: (message: Message) => void;
    reply: (message: Message) => void;
    ready: () => void;
  }

  export interface Message {
    id: string;
    content: string;
    channel_id: string;
    author: {
      id: string;
    };
    referenced_message: Message | null;
  }

  export class Client {
    constructor(token: string);

    on: ClientEvents;

    send(id: string, { content: string }): Promise<Message>;
  }
}
