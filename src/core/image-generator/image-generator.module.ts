import { Module } from '@nestjs/common';

import { GuildModule } from '#core/guilds/guild.module';

import { ImageGeneratorController } from './image-generator.controller';
import { ImageGeneratorService } from './image-generator.service';

@Module({
  imports: [GuildModule],
  controllers: [ImageGeneratorController],
  providers: [ImageGeneratorService],
  exports: [ImageGeneratorService],
})
export class ImageGeneratorModule {}
