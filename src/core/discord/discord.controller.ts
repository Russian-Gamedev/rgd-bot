import { Controller, Get, Param, Res } from '@nestjs/common';
import { type Response } from 'express';

import { DiscordService } from './discord.service';

@Controller('discord')
export class DiscordController {
  constructor(private readonly discordService: DiscordService) {}

  @Get('emoji/:emoji{/:size}')
  public async getEmojiImage(
    @Param('emoji') emoji: string,
    @Param('size') size = 128,
    @Res() res: Response,
  ) {
    const url = await this.discordService.getEmojiImage(emoji, size);
    if (!url) return res.sendStatus(404);
    return res.redirect(url);
  }

  @Get('/members')
  public async getMembersStats() {
    return this.discordService.getMembersStats();
  }
}
