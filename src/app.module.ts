import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { AppConfigModule } from '#common/config/config.module';
import { DatabaseModule } from '#common/database.module';
import { GitInfoService } from '#common/git-info.service';
import { RedisModule } from '#common/redis.module';
import { ActivityModule } from '#core/activity/activity.module';
import { AuthModule } from '#core/auth/auth.module';
import { BotsModule } from '#core/bots/bots.module';
import { DiscordModule } from '#core/discord/discord.module';
import { GuildModule } from '#core/guilds/guild.module';
import { MiniGamesModule } from '#core/mini-games/mini-games.module';
import { UserModule } from '#core/users/users.module';

import { AppController } from './app.controller';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    RedisModule,
    ScheduleModule.forRoot(),
    DiscordModule,
    UserModule,
    GuildModule,
    ActivityModule,
    BotsModule,
    MiniGamesModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [GitInfoService],
  exports: [GitInfoService],
})
export class AppModule {}
