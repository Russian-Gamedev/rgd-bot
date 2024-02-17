import { exec } from 'child_process';
import { Message, User } from 'discord.js';

import { DISCORD_CDN } from '#config/constants';

export const execAsync = (command: string) => {
  return new Promise<string>((res) => {
    exec(command, (_err, stdout) => {
      res(stdout.trim());
    });
  });
};

export function getDisplayAvatar(user: User) {
  if (user.avatar === null) {
    const id = (BigInt(user.id) >> 2n) % 6n;
    return DISCORD_CDN + `/embed/avatars/${id}.png`;
  }

  return user.displayAvatarURL({ size: 1024, extension: 'webp' });
}

export function getDisplayBanner(user: User) {
  return user.bannerURL({ size: 1024, extension: 'webp' });
}

export function pickRandom<T>(array: readonly T[]): T {
  const { length } = array;
  return array[Math.floor(Math.random() * length)];
}

export function getRelativeFormat(timestamp: number) {
  return `<t:${Math.floor(timestamp / 1_000)}:R>`;
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
  return `${time.hours} ч ${time.minutes.toString().padStart(2, '0')} мин`;
}

export function messageLink(message: Message) {
  return messageLinkRaw(message.guildId, message.channelId, message.id);
}

export function messageLinkRaw(
  guildId: string,
  channelId: string,
  message: string,
) {
  return `https://discord.com/channels/${guildId}/${channelId}/${message}`;
}
