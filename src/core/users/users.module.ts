import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { UserEntity } from './entities/user.entity';
import { commands } from './commands';
import { UserService } from './users.service';

@Module({
  imports: [MikroOrmModule.forFeature([UserEntity])],
  providers: [UserService, ...commands],
  exports: [UserService],
})
export class UserModule {}
