import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { GuildEventsModule } from '#core/guilds/events/guild-events.module';
import { GuildSettingsModule } from '#core/guilds/settings/guild-settings.module';

import { UserEntity } from './entities/user.entity';
import { UserRoleEntity } from './entities/user-roles.entity';
import { BirthdayService } from './birthday.service';
import { commands } from './commands';
import { UserService } from './users.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([UserEntity, UserRoleEntity]),
    GuildSettingsModule,
    GuildEventsModule,
  ],
  providers: [UserService, BirthdayService, ...commands],
  exports: [UserService],
})
export class UserModule {}
