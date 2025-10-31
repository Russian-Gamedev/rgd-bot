import { Module } from '@nestjs/common';

import { RedisModule } from '#common/redis.module';
import { FFMpegModule } from '#core/ffmpeg/ffmpeg.module';
import { GuildSettingsModule } from '#core/guilds/settings/guild-settings.module';
import { UserModule } from '#core/users/users.module';

import { AnswerChecker } from './utils/answer-checker';
import { SIGamePlayer } from './sigame.player';
import { SIGameService } from './sigame.service';

@Module({
  imports: [GuildSettingsModule, RedisModule, UserModule, FFMpegModule],
  providers: [SIGameService, SIGamePlayer, AnswerChecker],
})
export class SIGameModule {}
