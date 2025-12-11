import { Module } from '@nestjs/common';

import { VryadliCommand } from './commands/vraydly.command';

@Module({
  providers: [VryadliCommand],
})
export class FunModule {}
