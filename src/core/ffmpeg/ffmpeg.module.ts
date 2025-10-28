import { Module } from '@nestjs/common';

import { FFMpegService } from './ffmpeg.service';

@Module({
  providers: [FFMpegService],
  exports: [FFMpegService],
})
export class FFMpegModule {}
