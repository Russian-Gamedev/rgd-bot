import { GuildEmoji, ReactionEmoji } from 'discord.js';

export const EmojiWeight: Record<string, number> = {
  '1068392365636714556': -1, /// damir-clown
  '746270313112928257': -1, /// kolya-clown
  '🤡': -1,
  '874759751043514379': -1, /// poel-govno
  '765423655990722560': -1, /// cringe
};

export function getEmojiWeight(emoji: ReactionEmoji | GuildEmoji) {
  const key = emoji.id || emoji.name;
  return EmojiWeight[key] ?? 1;
}
