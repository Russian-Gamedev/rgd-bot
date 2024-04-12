export const OWNER_ID = process.env.OWNER_ID.split(',');

export const IS_DEV = process.env.NODE_ENV !== 'production';
export const BOT_ID = process.env.BOT_CLIENT_ID;
export const DISCORD_CDN = 'https://cdn.discordapp.com';

export enum Colors {
  Primary = 0x5c87e7,
  Warning = 0xff9900,
}

export enum GuildSettings {
  EventsMessage = 'events_message',
  StatsMessage = 'stats_message',
  SystemChannel = 'system_channel',
}

export enum BotEvents {
  MEMBER_FIRST_JOIN = 'member_first_join',
  MEMBER_JOIN = 'member_join',
  MEMBER_LEAVE = 'member_leave',
  MEMBER_BAN = 'member_ban',
  MEMBER_KICK = 'member_kick',
}
