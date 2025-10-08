import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { GuildSettingsEntity } from '../entities/guild-settings.entity';
import { GuildSettingsService } from './guild-settings.service';
import { commands } from './commands';

@Module({
  imports: [MikroOrmModule.forFeature([GuildSettingsEntity])],
  providers: [GuildSettingsService, ...commands],
  exports: [GuildSettingsService],
})
export class GuildSettingsModule {}
