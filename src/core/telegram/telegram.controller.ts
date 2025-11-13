import { Controller, Get, NotFoundException, Param, Res } from '@nestjs/common';
import { type Response } from 'express';
import path from 'path';

import { TelegramUpdate } from './telegram.update';

const assets = path.resolve(__dirname, '../../../assets/');

@Controller()
export class TelegramController {
  private htmlTemplate = '';

  constructor(private readonly telegramUpdate: TelegramUpdate) {}

  async onModuleInit() {
    this.htmlTemplate = await Bun.file(path.join(assets, 'embed.html')).text();
  }

  @Get('/embed/:fileId')
  async getEmbed(@Param('fileId') fileId: string) {
    const embed = await this.telegramUpdate.ensureVideoEmbed(fileId);
    if (!embed) {
      throw new NotFoundException('Видео не найдено');
    }

    const data = {
      name: embed.name,
      author: embed.author,
      size: (embed.size / (1024 * 1024)).toFixed(2),
      duration: embed.duration,
      width: embed.width,
      height: embed.height,
      link: embed.link,
    };

    let html = this.htmlTemplate;
    for (const [key, value] of Object.entries(data)) {
      html = html.replace(new RegExp(`%${key}%`, 'g'), String(value));
    }

    return html;
  }

  @Get('/embed/:fileId/video')
  async getVideo(@Param('fileId') fileId: string, @Res() res: Response) {
    const response = await this.telegramUpdate.fetchVideoEmbed(fileId);
    if (!response) {
      throw new NotFoundException('Видео не найдено');
    }

    /// stream the video response
    while (true) {
      const { done, value } = await response.read();
      if (done) {
        break;
      }
      res.write(value);
    }
    res.end();
  }
}
