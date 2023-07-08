import { LogLevel, SapphireClient } from '@sapphire/framework';
import { ActivityType, GatewayIntentBits, Partials } from 'discord.js';
import { join } from 'path';

import { databaseConnect } from '@/lib/database/database.config';

export class RgdClient<
  Ready extends boolean = boolean,
> extends SapphireClient<Ready> {
  public readonly dev = process.env.NODE_ENV !== 'production';

  constructor() {
    super({
      logger: {
        level:
          process.env.NODE_ENV === 'production'
            ? LogLevel.Info
            : LogLevel.Debug,
      },
      disableMentionPrefix: true,
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.MessageContent,
      ],
      partials: [Partials.Channel, Partials.Message, Partials.Reaction],
      baseUserDirectory: join(__dirname, '..'),
    });
  }

  override async login(token?: string): Promise<string> {
    await databaseConnect();
    return super.login(token);
  }

  setActivity(title: string) {
    if (!this.user) return;
    this.user.setActivity({
      type: ActivityType.Playing,
      name: title,
    });
  }
}
