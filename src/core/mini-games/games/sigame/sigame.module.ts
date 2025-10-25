import { Module } from '@nestjs/common';

import { RedisModule } from '#common/redis.module';
import { GuildSettingsModule } from '#core/guilds/settings/guild-settings.module';
import { UserModule } from '#core/users/users.module';

import { SIGamePlayer } from './sigame.player';
import { SIGameService } from './sigame.service';

@Module({
  imports: [GuildSettingsModule, RedisModule, UserModule],
  providers: [SIGameService, SIGamePlayer],
})
export class SIGameModule {}
