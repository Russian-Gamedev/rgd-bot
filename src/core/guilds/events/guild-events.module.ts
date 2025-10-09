import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { GuildEventEntity } from './entities/events.entity';
import { GuildEventService } from './guild-events.service';

@Module({
  imports: [MikroOrmModule.forFeature([GuildEventEntity])],
  providers: [GuildEventService],
  exports: [GuildEventService],
})
export class GuildEventsModule {}
