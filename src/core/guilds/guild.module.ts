import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';

import { GuildEntity } from './entities/guild.entity';
import { RoleEntity } from './entities/role.entity';
import { GuildSettingsModule } from './settings/guild-settings.module';
import { GuildController } from './guild.controller';
import { GuildService } from './guild.service';

@Module({
  imports: [
    MikroOrmModule.forFeature([GuildEntity, RoleEntity]),
    GuildSettingsModule,
  ],
  providers: [GuildService],
  controllers: [GuildController],
  exports: [GuildService],
})
export class GuildModule {}
