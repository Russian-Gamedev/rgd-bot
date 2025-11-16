import { ServerToClientEvents, ServerToClientPayload } from './bar.protocol';

export class Socket {
  id = (Date.now() * Math.random()).toString(36).replace('.', '');

  constructor(public readonly rawSocket: Bun.WebSocket) {}

  send<
    Event extends ServerToClientEvents,
    Payload extends ServerToClientPayload<Event>,
  >(event: Event, data: Payload, ts = Date.now()) {
    this.rawSocket.send(JSON.stringify({ type: event, data, ts }));
  }
}
