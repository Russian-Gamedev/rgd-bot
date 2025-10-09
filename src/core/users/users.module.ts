import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { GuildSettingsModule } from '#core/guilds/settings/guild-settings.module';

import { UserEntity } from './entities/user.entity';
import { commands } from './commands';
import { UserService } from './users.service';

@Module({
  imports: [MikroOrmModule.forFeature([UserEntity]), GuildSettingsModule],
  providers: [UserService, ...commands],
  exports: [UserService],
})
export class UserModule {}
