import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { GuildEventsCommands } from './commands/events.command';
import { GuildEventEntity } from './entities/events.entity';
import { GuildEventsController } from './guild-events.controller';
import { GuildEventService } from './guild-events.service';

@Module({
  imports: [MikroOrmModule.forFeature([GuildEventEntity])],
  controllers: [GuildEventsController],
  providers: [GuildEventService, GuildEventsCommands],
  exports: [GuildEventService],
})
export class GuildEventsModule {}
