import {
  Controller,
  Get,
  Headers,
  NotFoundException,
  Param,
  Res,
} from '@nestjs/common';
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

  @Get('/embed/:fileId/video.mp4')
  async getVideo(
    @Param('fileId') fileId: string,
    @Headers('range') range: string | undefined,
    @Res() res: Response,
  ) {
    const result = await this.telegramUpdate.fetchVideoEmbed(fileId, range);
    if (!result) {
      throw new NotFoundException('Видео не найдено');
    }

    const { stream, contentLength, contentType, start, end, isPartial } =
      result;

    // Set appropriate headers for range requests
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');

    if (isPartial) {
      res.status(206); // Partial Content
      res.setHeader('Content-Range', `bytes ${start}-${end}/${contentLength}`);
      res.setHeader('Content-Length', end - start + 1);
    } else {
      res.status(200);
      res.setHeader('Content-Length', contentLength);
    }

    // Allow caching
    res.setHeader('Cache-Control', 'public, max-age=31536000');

    // Stream the video
    try {
      while (true) {
        const { done, value } = await stream.read();
        if (done) {
          break;
        }
        if (!res.write(value)) {
          // Back-pressure: wait for drain event
          await new Promise((resolve) => res.once('drain', resolve));
        }
      }
      res.end();
    } catch (error) {
      console.error('Error streaming video:', error);
      if (!res.headersSent) {
        res.status(500).end();
      }
    }
  }
}
