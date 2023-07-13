import { exec } from 'child_process';
import { Message, User } from 'discord.js';

import { DISCORD_CDN } from '@/configs/constants';

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

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

export const shuffle = <T>(array: T[]): T[] => {
  let m = array.length;
  while (m) {
    const i = Math.floor(Math.random() * m--);
    [array[m], array[i]] = [array[i], array[m]];
  }
  return array;
};

export function randomRange(min: number, max: number, floor = true) {
  const value = Math.random() * (max - min) + min;
  return floor ? Math.floor(value) : value;
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
  };
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
