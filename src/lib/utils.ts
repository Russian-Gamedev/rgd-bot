import { exec } from 'child_process';
import { User } from 'discord.js';

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
