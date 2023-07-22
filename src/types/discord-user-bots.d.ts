declare module 'discord-user-bots' {
  export interface ClientEvents {
    message_create: (message: any) => void;
    ready: () => void;
  }

  export class Client {
    constructor(token: string);

    on: ClientEvents;

    send(id: string, { content: string }): void;
  }
}
