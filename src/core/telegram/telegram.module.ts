import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';

import { RedisModule } from '#common/redis.module';
import { EnvironmentVariables } from '#config/env';

import { TelegramUpdate } from './telegram.update';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables>) => ({
        token: config.getOrThrow('TELEGRAM_BOT_TOKEN'),
        options: {
          telegram: {
            apiRoot: config.get('TELEGRAM_API_ROOT'),
          },
        },
      }),
    }),
    MikroOrmModule.forFeature([]),
    RedisModule,
  ],
  providers: [TelegramUpdate],
  controllers: [],
})
export class TelegramModule {}
