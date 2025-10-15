import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { BotEntity } from './entities/bot.entity';
import { BotsController } from './bots.controller';
import { BotsService } from './bots.service';
import { BotsManagerService } from './bots-manager.service';

@Module({
  imports: [MikroOrmModule.forFeature([BotEntity])],
  providers: [BotsService, BotsManagerService],
  controllers: [BotsController],
})
export class BotsModule {}
