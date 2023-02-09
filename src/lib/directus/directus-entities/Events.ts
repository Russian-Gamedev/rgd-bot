import { DirectusEntity } from '../directus-orm/entity';

export enum TemplateType {
  MEMBER_FIRST_JOIN = 'member_first_join',
  MEMBER_JOIN = 'member_join',
  MEMBER_LEAVE = 'member_leave',
  MEMBER_BAN = 'member_ban',
  MEMBER_KICK = 'member_kick',
}

export type TemplateEvent = {
  message: string;
  attachment: string | null;
};

export class DiscordEvents extends DirectusEntity {
  static override collection = 'Bot_Events';

  declare id: number;
  type: `${TemplateType}`;
  message: string;
  attachment: string | null;
}
