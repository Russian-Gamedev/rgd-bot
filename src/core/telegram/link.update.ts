import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { MessageFlags } from 'discord.js';
import {
  Context as DiscordContext,
  Options,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';
import { Command, Ctx, InjectBot, Start, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';

import { LinkCodeDto } from './dto/link.dto';
import { TelegramLinkEntity } from './entities/link.entity';

@Update()
export class TelegramLinkService {
  constructor(
    @InjectBot()
    private readonly entityManager: EntityManager,
    @InjectRepository(TelegramLinkEntity)
    private readonly linkRepository: EntityRepository<TelegramLinkEntity>,
  ) {}

  private readonly codeTTL = 10 * 60; // 10 minutes
  private readonly waitUsers = new Map<string, [number, number]>();

  async onModuleInit() {
    setInterval(() => this.cleanupCodes(), 60 * 1000);
  }

  @Start()
  async onStart(@Ctx() ctx: Context) {
    await ctx.reply(
      'Добро пожаловать в RGD Bot!\n\nЭтот бот ничего не делает :)',
    );
  }

  @Command('link')
  async startLink(@Ctx() ctx: Context) {
    const telegram_id = String(ctx.from?.id);
    const hasLink = await this.linkRepository.findOne({ telegram_id });
    if (hasLink) {
      await ctx.reply('Вы уже связаны с дискордом.');
      return;
    }

    if (this.waitUsers.has(telegram_id)) {
      await ctx.reply(
        'Вы уже начали процесс привязки. Пожалуйста, используйте предоставленный ранее код в дискорде.',
      );
      return;
    }

    const code = [...Array(6)]
      .map(() => Math.floor(Math.random() * 10))
      .join('');
    this.waitUsers.set(code, [Number(telegram_id), Date.now()]);
    const command = `/telegram-link \`${code}\``;

    return ctx.reply(
      `Чтобы связать ваш телеграм с дискордом, используйте команду в дискорде:\n\n` +
        command +
        `\n\nКод действителен в течение ${this.codeTTL / 60} минут.`,
      {
        parse_mode: 'Markdown',
      },
    );
  }

  @SlashCommand({
    name: 'telegram-link',
    description: 'Привязать телеграм аккаунт к дискорду',
  })
  async onDiscordLinkCommand(
    @DiscordContext() [interaction]: SlashCommandContext,
    @Options() dto: LinkCodeDto,
  ) {
    const codeData = this.waitUsers.get(dto.code);
    if (!codeData) {
      await interaction.reply({
        content:
          'Неверный или истекший код привязки. Пожалуйста, начните процесс привязки заново в телеграме.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    const [telegram_id] = codeData;

    const existingLink = await this.linkRepository.findOne({
      discord_id: BigInt(interaction.user.id),
    });
    if (existingLink) {
      await interaction.reply({
        content: 'Этот дискорд аккаунт уже привязан к телеграму.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const link = new TelegramLinkEntity();
    link.telegram_id = BigInt(telegram_id);
    link.discord_id = BigInt(interaction.user.id);

    await this.entityManager.persistAndFlush(link);
    this.waitUsers.delete(dto.code);

    await interaction.reply({
      content: 'Ваш телеграм аккаунт успешно привязан к дискорду!',
      flags: MessageFlags.Ephemeral,
    });
  }

  private cleanupCodes() {
    const now = Date.now();
    for (const [code, [, timestamp]] of this.waitUsers) {
      if (now - timestamp > this.codeTTL * 1000) {
        this.waitUsers.delete(code);
      }
    }
  }
}
