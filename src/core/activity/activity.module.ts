import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { RedisModule } from '#common/redis.module';
import { GuildSettingsModule } from '#core/guilds/settings/guild-settings.module';
import { UserModule } from '#core/users/users.module';

import { ActivityEntity } from './entities/activity.entity';
import { ActivityJobService } from './activity-job.service';
import { ActivityWatchService } from './activity-watch.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([ActivityEntity]),
    RedisModule,
    GuildSettingsModule,
    UserModule,
  ],
  providers: [ActivityWatchService, ActivityJobService],
})
export class ActivityModule {}
