import { BaseImageURLOptions, GuildMember, Message, User } from 'discord.js';

import { DISCORD_CDN } from '#config/constants';

export function noop() {
  // nothing, as how make game in rgd
}

export function cast<T>(value: unknown) {
  return value as T;
}

export function getDisplayAvatar(
  user: User | GuildMember,
  extension: BaseImageURLOptions['extension'] = 'webp',
) {
  if (user.avatar === null) {
    const id = (BigInt(user.id) >> 2n) % 6n;
    return DISCORD_CDN + `/embed/avatars/${id}.png`;
  }

  return user.displayAvatarURL({ size: 1024, extension });
}

export function getDisplayBanner(
  user: User,
  extension: BaseImageURLOptions['extension'] = 'webp',
) {
  return user.bannerURL({ size: 1024, extension });
}

export function pickRandom<T>(array: readonly T[]): T {
  const { length } = array;
  return array[Math.floor(Math.random() * length)];
}

export function getRelativeFormat(timestamp: number) {
  return `<t:${Math.floor(timestamp / 1_000)}:R>`;
}

export function messageLink(message: Message<true>) {
  return messageLinkRaw(message.guildId, message.channelId, message.id);
}

export function messageLinkRaw(
  guildId: string,
  channelId: string,
  message: string,
) {
  return `https://discord.com/channels/${guildId}/${channelId}/${message}`;
}

export function getTimeInfo(t: number) {
  const days = Math.floor(t / 86400);
  t -= days * 86400;
  const hours = Math.floor(t / 3600);
  t -= hours * 3600;
  const minutes = Math.floor(t / 60);
  t -= minutes * 60;
  const seconds = t;

  return {
    days,
    hours,
    minutes,
    seconds,
    toString: () =>
      `${hours} ч ${minutes.toString().padStart(2, '0')} мин ${seconds
        .toString()
        .padStart(2, '0')} сек`,
  };
}

export function formatTime(t: number) {
  const time = getTimeInfo(t);
  let result = '';
  if (time.days > 0) {
    result += `${time.days} д `;
  }
  if (time.hours > 0) {
    result += `${time.hours} ч `;
  }
  if (time.minutes > 0) {
    result += `${time.minutes} мин `;
  }
  if (time.seconds > 0 || result === '') {
    result += `${time.seconds} сек`;
  }
  return result.trim();
}
