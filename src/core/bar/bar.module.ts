import { Module } from '@nestjs/common';

import { GuildSettingsModule } from '#core/guilds/settings/guild-settings.module';

import { BarGateway } from './bar.gateway';
import { BarWatcher } from './bar.watcher';

@Module({
  imports: [GuildSettingsModule],
  providers: [BarWatcher, BarGateway],
})
export class BarModule {}
