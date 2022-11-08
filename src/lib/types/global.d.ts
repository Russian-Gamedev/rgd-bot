import { ResponseManager } from '../response-manager';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { MikroORM } from '@mikro-orm/core';

import { Guild, TextChannel } from 'discord.js';

declare module '@sapphire/pieces' {
  interface Container {
    orm: MikroORM<SqliteDriver>;
    rgd: Guild;
    mainChannel: TextChannel;
    responseManager: ResponseManager;
  }
}
