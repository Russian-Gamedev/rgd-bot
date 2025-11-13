import { Injectable, Logger } from '@nestjs/common';
import { Client } from 'discord.js';
import Redis from 'ioredis';
import { Once } from 'necord';

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);

  constructor(
    private readonly client: Client,
    private readonly redis: Redis,
  ) {}

  @Once('clientReady')
  public onReady() {
    this.logger.log('Discord client is ready!');
  }

  public async getEmojiImage(emoji: string, size = 128) {
    const emojiId = this.client.emojis.cache.find((e) => e.name === emoji);
    if (!emojiId) return null;
    return emojiId.imageURL({ animated: true, extension: 'webp', size });
  }

  public async getMembersStats() {
    const cached = await this.redis.get('discord:members_stats');
    if (cached) {
      return JSON.parse(cached);
    }

    const guilds = this.client.guilds.cache;
    let totalMembers = 0;
    let onlineMembers = 0;
    for (const guild of guilds.values()) {
      const members = await guild.members.fetch();
      totalMembers += members.size;
      onlineMembers += members.filter(
        (member) => member.presence?.status === 'online',
      ).size;
    }

    const response = {
      total: totalMembers,
      online: onlineMembers,
    };

    await this.redis.set(
      'discord:members_stats',
      JSON.stringify(response),
      'EX',
      300,
    );

    return response;
  }
}
