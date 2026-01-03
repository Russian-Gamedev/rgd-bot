import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { $ } from 'bun';
import fs from 'fs/promises';

import { EnvironmentVariables } from '#config/env';

@Injectable()
export class FFMpegService {
  private readonly logger = new Logger(FFMpegService.name);
  private readonly ffmpegURL =
    'https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz';

  private readonly binFFMpegPath = './bin/ffmpeg';
  private readonly binFFProbePath = './bin/ffprobe';

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  async onModuleInit() {
    const useFmpeg = this.configService.get<boolean>('USE_FFMPEG', false);
    if (!useFmpeg) {
      this.logger.log('FFMpeg usage is disabled via configuration.');
      return;
    }

    await this.checkFFMpegExists();
    const version = await this.getVersion();
    this.logger.log(`FFMpeg Version:\n${version}`);
  }

  private async checkFFMpegExists() {
    this.logger.log('Checking FFMpeg binary...');

    await fs.mkdir('./bin', { recursive: true });

    try {
      const version = await $`ffmpeg -version`.text().catch(() => null);

      if (version?.includes('ffmpeg version')) {
        this.logger.log('FFMpeg is already installed globally.');
        const isLinked = await fs.stat('./bin/ffmpeg').catch(() => null);
        if (isLinked) return;
        const pathToFfmpeg = await $`which ffmpeg`.text();
        await fs.symlink(pathToFfmpeg.trim(), './bin/ffmpeg');
        await fs.symlink(
          pathToFfmpeg.replace('ffmpeg', 'ffprobe').trim(),
          './bin/ffprobe',
        );
        return;
      }
      await fs.access('./bin/ffmpeg');
      this.logger.log('FFMpeg binary found in ./bin.');
    } catch (error) {
      this.logger.debug(error);
      this.logger.log('FFMpeg not found. Downloading and installing...');
      const response = await fetch(this.ffmpegURL);
      if (!response.ok) {
        this.logger.error(
          `Failed to download FFMpeg: ${response.status} ${response.statusText}`,
        );
        return;
      }

      const arrayBuffer = await response.arrayBuffer();
      const tarPath = './bin/ffmpeg.tar.xz';
      await fs.writeFile(tarPath, Buffer.from(arrayBuffer));
      await $`tar -xJf ${tarPath} -C ./bin --strip-components=1`;
      await $`chmod +x ./bin/ffmpeg ./bin/ffprobe`;
      await fs.unlink(tarPath);
      this.logger.log('FFMpeg installation complete.');
    }
  }

  async getVersion() {
    const version = await $`${this.binFFMpegPath} -version`.text();
    return version;
  }

  async getDuration(filePath: string) {
    const out =
      await $`${this.binFFProbePath} -v error -show_entries format=duration -of csv=p=0 ${filePath}`.text();
    return parseFloat(out);
  }
  async getAudioBitrate(file: string) {
    const out =
      await $`${this.binFFProbePath} -v error -select_streams a:0 -show_entries stream=bit_rate -of csv=p=0 ${file}`.text();
    return parseFloat(out.trim()) / 1024; // → KiB/s
  }

  async compressFile(
    inputFile: string,
    outputFile: string,
    targetSize: number,
  ) {
    const duration = await this.getDuration(inputFile);
    const audioBitrate = await this.getAudioBitrate(inputFile);

    const minSize = (audioBitrate * duration) / 8192; // in MiB
    if (targetSize < minSize) {
      this.logger.warn(
        `Target size ${targetSize} MiB is too small. Minimum possible size is ${minSize.toFixed(
          2,
        )} MiB.`,
      );
      throw new Error('Target size too small');
    }

    const targetVideoBitrate =
      (targetSize * 8192) / (1.048576 * duration) - audioBitrate;

    await $`echo y | ${this.binFFMpegPath} -i ${inputFile} -c:v libx264 -b:v ${targetVideoBitrate}k -pass 1 -an -f mp4 /dev/null`;
    await $`${this.binFFMpegPath} -i ${inputFile} -c:v libx264 -b:v ${targetVideoBitrate}k -pass 2 -c:a aac -b:a ${audioBitrate}k ${outputFile}`;

    return true;
  }
}
