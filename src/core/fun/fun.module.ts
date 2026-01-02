import { Module } from '@nestjs/common';

import { VryadliCommand } from './commands/vraydly.command';
import { FunService } from './fun.service';

@Module({
  providers: [VryadliCommand, FunService],
})
export class FunModule {}
