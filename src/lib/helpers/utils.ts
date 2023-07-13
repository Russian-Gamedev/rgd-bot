import { GuildMember, Message } from 'discord.js';

export async function messageUserReactionCount(
  message: Message,
  member: GuildMember,
) {
  let count = 0;

  for (const react of message.reactions.cache.values()) {
    const reactUsers = await react.users.fetch();
    count += +reactUsers.has(member.id);
  }

  return count;
}
