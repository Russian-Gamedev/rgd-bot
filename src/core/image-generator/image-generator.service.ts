import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Renderer } from '@takumi-rs/core';
import { fromJsx } from '@takumi-rs/helpers/jsx';
import { Client } from 'discord.js';
import Redis from 'ioredis';
import path from 'path';

import { GuildService } from '#core/guilds/guild.service';

import { renderInviteBanner } from './renderers/invite-banner';

export interface ImageRenderer {
  node: Awaited<ReturnType<typeof fromJsx>>;
  height: number;
  width: number;
}

const fonts = ['Ginto Regular.ttf', 'Mulish-Medium.ttf'];

@Injectable()
export class ImageGeneratorService {
  private readonly logger = new Logger(ImageGeneratorService.name);
  private renderer: Renderer;

  constructor(
    private readonly discord: Client,
    private readonly guildService: GuildService,
    private readonly redis: Redis,
  ) {}

  async onModuleInit() {
    const loadedFonts = await Promise.all(
      fonts.map(async (fontPath) => {
        this.logger.log(`Loading font: ${fontPath}`);
        const data = await Bun.file(
          path.resolve('assets/fonts', fontPath),
        ).arrayBuffer();
        const name = path
          .basename(fontPath, path.extname(fontPath))
          /// split by space or hyphen and take first part
          .split(/[- ]/)[0];
        return { name, data };
      }),
    );

    this.renderer = new Renderer({ fonts: loadedFonts });
    this.logger.log('Image renderer initialized');
  }

  public async renderInviteBanner(inviteCode: string) {
    console.log(inviteCode);
    throw new ForbiddenException('Invite banners are disabled');
  }

  private cacheImage(key: string, ttl: number) {
    return {
      get: async () => {
        const cached = await this.redis.get(key);
        if (cached) {
          return Buffer.from(cached, 'base64');
        }
        return null;
      },
      set: async (data: Buffer) => {
        await this.redis.set(key, data.toString('base64'), 'EX', ttl);
      },
    };
  }
}
