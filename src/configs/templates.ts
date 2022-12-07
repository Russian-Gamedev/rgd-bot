export enum TemplateType {
  MEMBER_FIRST_JOIN = 'member_first_join',
  MEMBER_JOIN = 'member_join',
  MEMBER_LEAVE = 'member_leave',
  MEMBER_BAN = 'member_ban',
  MEMBER_KICK = 'member_kick',
}

export const TEMPLATES: Record<TemplateType, TemplateEvent[]> = {
  member_first_join: [],
  member_join: [],
  member_leave: [],
  member_ban: [],
  member_kick: [],
};

export type TemplateEvent = {
  message: string;
  attachment: string | null;
};
