import { LogLevel, SapphireClient } from '@sapphire/framework';
import * as process from 'process';
import { ActivityType, GatewayIntentBits, Partials } from 'discord.js';

export class RgdClient extends SapphireClient {
  public dev = process.env.NODE_ENV !== 'production';

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
    });
  }

  setActivity(title: string) {
    this.user.setActivity({
      type: ActivityType.Playing,
      name: title,
    });
  }
}
