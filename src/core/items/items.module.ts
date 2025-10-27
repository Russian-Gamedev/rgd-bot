import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { UserModule } from '#core/users/users.module';

import { ItemsCommands } from './commands/items.command';
import { ItemEntity } from './entities/item.entity';
import { ItemsService } from './items.service';

@Module({
  imports: [MikroOrmModule.forFeature([ItemEntity]), UserModule],
  providers: [ItemsService, ItemsCommands],
})
export class ItemsModule {}
