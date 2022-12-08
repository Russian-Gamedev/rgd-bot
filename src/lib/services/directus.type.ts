import type { TemplateType } from '../../configs/templates';

export enum Collections {
  User = 'user',
  BotEvents = 'Bot_Events',
}

export type CollectionsType = {
  [Collections.BotEvents]: BotEvent;
  [Collections.User]: User;
};

export type BotEvent = {
  id: number;
  type: `${TemplateType}`;
  message: string;
  attachment: string | null;
};

export type User = {
  id: string;
  username: string;
  avatar: string;
  banner: string | null;
  voiceTime: number;
  reputation: number;
  coins: number;
  leaveCount: number;
  firstJoin: string;
  about: string | null;
  birthData: string | null;
};
