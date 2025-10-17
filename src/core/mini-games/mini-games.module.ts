import { Module } from '@nestjs/common';

import { UserModule } from '#core/users/users.module';

import { FlipGame } from './games/flip.game';
import { SlotGame } from './games/slot.game';

@Module({
  imports: [UserModule],
  providers: [FlipGame, SlotGame],
})
export class MiniGamesModule {}
