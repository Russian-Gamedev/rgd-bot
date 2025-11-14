import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { Ctx, InjectBot, On, Start, Update } from 'nestjs-telegraf';
import { Context, Telegraf } from 'telegraf';

import { EnvironmentVariables } from '#config/env';

import { VideoEmbedEntity, VideoInfo } from './entities/video-embed.entity';

@Update()
export class TelegramUpdate {
  constructor(
    @InjectBot()
    private readonly bot: Telegraf,
    @InjectRepository(VideoEmbedEntity)
    private readonly videoEmbedRepository: EntityRepository<VideoEmbedEntity>,
    private readonly entityManager: EntityManager,
    private readonly redis: Redis,
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  @Start()
  protected async onStart(@Ctx() ctx: Context) {
    await ctx.reply(
      'Добро пожаловать в RGD Bot!\n\nОтправь мне видео и я помогу загрузить его на Discord сервер.',
    );
  }

  @On('video')
  protected async handleVideo(@Ctx() ctx: Context) {
    if (!ctx.msg.has('video')) return;
    const video = ctx.msg.video;
    const videoInfo: VideoInfo = {
      width: video.width,
      height: video.height,
      duration: video.duration,
      size: video.file_size ?? 0,
      name: ctx.msg.caption ?? video.file_name ?? 'Unnamed',
      author: ctx.msg.from?.username ?? 'Unknown',
      link: `${this.baseUrl}/embed/${video.file_id}`,
    };

    const key = 'video:' + video.file_id;
    const linkToEmbed = videoInfo.link;

    const replyMessage = `Название: ${videoInfo.name}
Автор: ${videoInfo.author}
Размер: ${(videoInfo.size / (1024 * 1024)).toFixed(2)} MB
Продолжительность: ${videoInfo.duration} секунд
Разрешение: ${videoInfo.width}x${videoInfo.height}

Ссылка для загрузки: ${linkToEmbed}`;

    const cached = await this.redis.get(key);
    if (cached) {
      await ctx.reply(replyMessage);
      return;
    }
    const videoEmbed = new VideoEmbedEntity();
    videoEmbed.file_id = video.file_id;
    videoEmbed.metadata = videoInfo;

    await this.entityManager.persistAndFlush(videoEmbed);
    await this.redis.set(key, JSON.stringify(videoInfo), 'EX', 60 * 60); // Cache for 1 hour

    await ctx.reply(replyMessage);
  }

  public async fetchVideoEmbed(fileId: string) {
    const videoInfo = await this.ensureVideoEmbed(fileId);
    if (!videoInfo) {
      return null;
    }

    const link = await this.bot.telegram.getFileLink(fileId);
    const pathToFile =
      this.telegramURL +
      link.pathname.replace('/var/lib/telegram-bot-api/', '/file/bot');

    const upstream = await fetch(pathToFile);
    if (!upstream.ok) {
      throw new Error('Failed to fetch video from Telegram');
    }

    return upstream.body?.getReader();
  }

  async ensureVideoEmbed(fileId: string) {
    const key = 'video:' + fileId;
    const cached = await this.redis.get(key);
    if (cached) {
      return JSON.parse(cached) as VideoInfo;
    }
    const videoEmbed = await this.videoEmbedRepository.findOne({
      file_id: fileId,
    });
    if (videoEmbed) {
      await this.redis.set(key, JSON.stringify(videoEmbed), 'EX', 60 * 60);
    }
    return videoEmbed?.metadata;
  }

  private get baseUrl(): string {
    return this.configService.getOrThrow<string>('BASE_URL');
  }

  private get telegramURL(): string {
    return this.bot.telegram.options.apiRoot;
  }
}
