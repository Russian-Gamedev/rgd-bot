import { EntityManager } from '@mikro-orm/postgresql';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Ctx, InjectBot, Start, Update } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';

import { EnvironmentVariables } from '#config/env';

@Update()
export class TelegramUpdate {
  constructor(
    @InjectBot()
    private readonly bot: Telegraf,
    private readonly entityManager: EntityManager,
    private readonly redis: Redis,
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  @Start()
  protected async onStart(@Ctx() ctx: Context) {
    await ctx.reply(
      'Добро пожаловать в RGD Bot!\n\nЭтот бот ничего не делает :)',
    );
  }
}
