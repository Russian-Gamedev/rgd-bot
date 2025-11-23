import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { GuildEventsCommands } from './commands/events.command';
import { GuildEventEntity } from './entities/events.entity';
import { GuildEventService } from './guild-events.service';

@Module({
  imports: [MikroOrmModule.forFeature([GuildEventEntity])],
  providers: [GuildEventService, GuildEventsCommands],
  exports: [GuildEventService],
})
export class GuildEventsModule {}
