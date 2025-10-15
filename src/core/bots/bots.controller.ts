import { Controller, Get, UseGuards } from '@nestjs/common';

import { BotEntity } from './entities/bot.entity';
import { BotTarget } from './bots.decorator';
import { BotApiGuard } from './bots.guard';
import { BotsService } from './bots.service';

@Controller('bots')
@UseGuards(BotApiGuard)
export class BotsController {
  constructor(private readonly botsService: BotsService) {}

  @Get('me')
  getMe(@BotTarget() bot: BotEntity) {
    return bot;
  }
}
