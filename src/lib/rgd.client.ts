import { MikroORM, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { LogLevel, SapphireClient } from '@sapphire/framework';
import { container } from '@sapphire/pieces';
import {
  ActivityType,
  IntentsBitField,
  OAuth2Scopes,
  Partials,
} from 'discord.js';
import { join } from 'path';
import { createClient } from 'redis';

import MikroOrmConfig from '#base/mikro-orm.config';
import { IS_DEV } from '#config/constants';

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
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.GuildMessageReactions,
        IntentsBitField.Flags.GuildPresences,
        IntentsBitField.Flags.GuildVoiceStates,
        IntentsBitField.Flags.GuildModeration,
        IntentsBitField.Flags.GuildInvites,
        IntentsBitField.Flags.MessageContent,
      ],
      partials: [
        Partials.Channel,
        Partials.Message,
        Partials.Reaction,
        Partials.GuildMember,
      ],
      baseUserDirectory: join(__dirname, '..'),
      defaultPrefix: '!',
      loadMessageCommandListeners: true,
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
    const orm = await MikroORM.init<PostgreSqlDriver>(MikroOrmConfig);
    if (await orm.isConnected()) {
      container.logger.info('ORM connected');
    }
    container.orm = orm;

    if (IS_DEV) {
      await container.orm.schema.updateSchema();
    } else {
      const migrationNeeded =
        await container.orm.migrator.checkMigrationNeeded();

      if (migrationNeeded) {
        const pendingMigrations = await orm.migrator.getPendingMigrations();
        container.logger.info(`Pending migrations: `);
        container.logger.info(
          pendingMigrations.map((migration) => migration.name).join('\n'),
        );
        container.logger.info('Run migration up');
        await orm.migrator.up();
        container.logger.info('Migration end');
      }
    }

    container.redis = createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
      },
      database: Number(process.env.REDIS_DB),
      password: process.env.REDIS_PASSWORD,
    });

    await container.redis.connect();
    if (container.redis.isReady) {
      container.logger.info('redis connected');
    }

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
