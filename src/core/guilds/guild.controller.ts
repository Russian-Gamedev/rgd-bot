import { Controller, Get, Param } from '@nestjs/common';

import { GuildService } from './guild.service';

@Controller('guilds')
export class GuildController {
  constructor(private readonly guildService: GuildService) {}

  @Get()
  async getGuilds() {
    return this.guildService.getGuilds();
  }

  @Get('/:guildId/roles')
  async getGuildRoles(@Param('guildId') guildId: bigint) {
    return this.guildService.getGuildRoles(guildId);
  }
}
