import { Module } from '@nestjs/common';

import { UserModule } from '#core/users/users.module';

import { FlipGame } from './games/flip.game';

@Module({
  imports: [UserModule],
  providers: [FlipGame],
})
export class MiniGamesModule {}
