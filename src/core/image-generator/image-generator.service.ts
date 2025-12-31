import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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
    this.logger.debug(`Requested render invite banner for code: ${inviteCode}`);
    const cache = this.cacheImage(`invite-banner:${inviteCode}`, 3600);
    const cachedImage = await cache.get();
    if (cachedImage) {
      this.logger.debug(`Cache hit for invite banner: ${inviteCode}`);
      return cachedImage;
    }

    const time = Date.now();
    this.logger.debug(`Cache miss for invite banner: ${inviteCode}`);

    const invite = await this.discord.fetchInvite(inviteCode).catch(() => null);

    if (!invite?.guild) {
      throw new NotFoundException('Invite not found');
    }

    const guild = await this.guildService.getGuildById(invite.guild.id);

    const title = invite.guild.name;
    const iconURL = invite.guild.iconURL({ size: 128 }) ?? '';
    const members = invite.memberCount ?? 0;
    const online = invite.presenceCount ?? 0;
    const banner = guild?.custom_banner_url ?? invite.guild.bannerURL();

    const { width, height, node } = await renderInviteBanner({
      title,
      iconURL,
      members,
      online,
      banner,
    });
    const buffer = await this.renderer.render(node, {
      width,
      height,
      format: 'webp',
    });
    await cache.set(buffer);
    this.logger.debug(
      `Rendered invite banner for code: ${inviteCode} in ${
        Date.now() - time
      }ms`,
    );
    return buffer;
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
