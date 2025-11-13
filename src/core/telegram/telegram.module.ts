import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';

import { RedisModule } from '#common/redis.module';
import { EnvironmentVariables } from '#config/env';

import { VideoEmbedEntity } from './entities/video-embed.entity';
import { TelegramController } from './telegram.controller';
import { TelegramUpdate } from './telegram.update';

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables>) => ({
        token: config.getOrThrow('TELEGRAM_BOT_TOKEN'),
        botName: 'rgd_discord_bot',
      }),
    }),
    MikroOrmModule.forFeature([VideoEmbedEntity]),
    RedisModule,
  ],
  providers: [TelegramUpdate],
  controllers: [TelegramController],
})
export class TelegramModule {}
