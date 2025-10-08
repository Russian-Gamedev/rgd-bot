import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { GuildEntity } from './entities/guild.entity';
import { GuildService } from './guild.service';
import { GuildController } from './guild.controller';
import { RoleEntity } from './entities/role.entity';
import { GuildSettingsService } from './settings/guild-settings.service';
import { GuildSettingsEntity } from './entities/guild-settings.entity';
import { GuildSettingsModule } from './settings/guild-settings.module';

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
