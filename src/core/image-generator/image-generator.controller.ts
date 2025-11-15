import { Controller, Get, Header, Param, StreamableFile } from '@nestjs/common';

import { ImageGeneratorService } from './image-generator.service';

@Controller('embed')
export class ImageGeneratorController {
  constructor(private readonly imageGeneratorService: ImageGeneratorService) {}

  @Get('/invite/:code/banner')
  @Header('Cache-Control', 'public, max-age=3600')
  @Header('Content-Type', 'image/webp')
  async getInviteBanner(@Param('code') code: string) {
    const file = await this.imageGeneratorService.renderInviteBanner(code);
    return new StreamableFile(file);
  }
}
