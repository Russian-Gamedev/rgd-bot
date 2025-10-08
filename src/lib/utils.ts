import { BaseImageURLOptions, GuildMember, Message, User } from 'discord.js';

import { DISCORD_CDN } from '#config/constants';

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
  const hours = Math.floor(t / 3600);
  const minutes = Math.floor((t - hours * 3600) / 60);
  const seconds = Math.floor(t - (hours * 3600 + minutes * 60));

  return {
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
  if (time.hours > 0) {
    return `${time.hours} ч ${time.minutes.toString().padStart(2, '0')} мин`;
  }
  return `${time.minutes} мин ${time.seconds.toString().padStart(2, '0')} сек`;
}
