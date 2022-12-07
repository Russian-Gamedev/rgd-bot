import { SqliteDriver } from '@mikro-orm/sqlite';
import { MikroORM } from '@mikro-orm/core';

import { Guild, TextChannel } from 'discord.js';
import { API } from 'lib/services/directus';

declare module '@sapphire/pieces' {
  interface Container {
    orm: MikroORM<SqliteDriver>;
    rgd: Guild;
    mainChannel: TextChannel;
    api: API;
  }
}
