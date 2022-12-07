import type { TemplateType } from '../../configs/templates';

export type Collections = {
  Bot_Events: BotEvent;
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
