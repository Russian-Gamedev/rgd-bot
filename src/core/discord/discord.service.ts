import { Injectable, Logger } from '@nestjs/common';
import { Client } from 'discord.js';
import { Once } from 'necord';

@Injectable()
export class DiscordService {
  private readonly logger = new Logger(DiscordService.name);

  constructor(private readonly client: Client) {}

  @Once('clientReady')
  public onReady() {
    this.logger.log('Discord client is ready!');
  }

  public async getEmojiImage(emoji: string, size = 128) {
    const emojiId = this.client.emojis.cache.find((e) => e.name === emoji);
    if (!emojiId) return null;
    return emojiId.imageURL({ animated: true, extension: 'webp', size });
  }
}
