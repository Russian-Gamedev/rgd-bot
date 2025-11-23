import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { RoleReactionEntity } from './entities/role-reaction.entity';
import { RoleReactionService } from './role-reaction.service';
import { RoleReactionWatcher } from './role-reaction.watcher';

@Module({
  imports: [MikroOrmModule.forFeature([RoleReactionEntity])],
  providers: [RoleReactionService, RoleReactionWatcher],
})
export class RoleManagerModule {}
