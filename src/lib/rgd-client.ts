import { LogLevel, SapphireClient } from '@sapphire/framework';
import { container } from '@sapphire/pieces';
import {
  ActivityType,
  GatewayIntentBits,
  OAuth2Scopes,
  Partials,
} from 'discord.js';
import { join } from 'path';

import { databaseConnect } from '#lib/database/database.config';
import { RgdShop } from '#lib/shop';
import { RgdShopStore } from '#lib/shop/rgd-shop-store';

export class RgdClient<
  Ready extends boolean = boolean,
> extends SapphireClient<Ready> {
  constructor() {
    super({
      logger: {
        level: LogLevel.Debug,
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
      partials: [
        Partials.Channel,
        Partials.Message,
        Partials.Reaction,
        Partials.GuildMember,
      ],
      baseUserDirectory: join(__dirname, '..'),
      tasks: {
        bull: {
          connection: {
            host: process.env.REDIS_HOST,
            port: Number(process.env.REDIS_PORT),
            password: process.env.REDIS_PASSWORD,
            db: Number(process.env.REDIS_DB),
          },
        },
      },
      api: {
        prefix: 'api/',
        origin: '*',
        automaticallyConnect: true,
        listenOptions: {
          host: 'localhost',
          port: Number(process.env.PORT),
        },
        auth: {
          id: process.env.BOT_CLIENT_ID,
          secret: process.env.OAUTH_SECRET,
          cookie: process.env.OUATH_COOKIE,
          redirect: 'https://rgd.chat',
          scopes: [OAuth2Scopes.Identify],
          transformers: [],
          domainOverwrite: '127.0.0.1',
        },
      },
    });
  }

  override async login(token?: string): Promise<string> {
    await databaseConnect();

    container.RgdShop = new RgdShop();
    this.stores.register(container.RgdShop.store);

    container.RgdShop.store.registerPath(join(__dirname, RgdShopStore.name));

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
