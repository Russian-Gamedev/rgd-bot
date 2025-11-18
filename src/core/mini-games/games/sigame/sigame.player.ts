import { Injectable, Logger, UseInterceptors } from '@nestjs/common';
import { EmbedBuilder, InteractionContextType, MessageFlags } from 'discord.js';
import {
  Context,
  type ContextOf,
  createCommandGroupDecorator,
  On,
  Options,
  type SlashCommandContext,
  Subcommand,
} from 'necord';

import { UserService } from '#core/users/users.service';
import { DiscordID } from '#root/lib/types';

import {
  SIGamePackAutocompleteInterceptor,
  SIGameSearchDTO,
} from './commands/sigame.autocomplete';
import { Answer, AnswerChecker } from './engine/utils/answer-checker';
import { SIGameController } from './sigame.controller';
import { SIGameColor, SIGameEmbedBuilder } from './sigame.embed';

const SICommandDecorator = createCommandGroupDecorator({
  name: 'sigame',
  description: 'SIGame commands',
  contexts: [InteractionContextType.Guild],
});

@Injectable()
@SICommandDecorator()
export class SIGamePlayer {
  private readonly logger = new Logger(SIGamePlayer.name);
  private readonly _answerLocks = new Map<string, boolean>();

  constructor(
    private readonly userService: UserService,
    private readonly sigameController: SIGameController,
    private readonly answerChecker: AnswerChecker,
  ) {}

  @UseInterceptors(SIGamePackAutocompleteInterceptor)
  @Subcommand({
    name: 'start',
    description: 'Начать игру с SIGame пакетом',
  })
  async startGameCommand(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: SIGameSearchDTO,
  ) {
    const isRunning = await this.sigameController.isGameRunning(
      interaction.guildId!,
    );
    if (isRunning) {
      await interaction.reply({
        content:
          'Игра SIGame уже запущена в этом сервере. Завершите её перед началом новой.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const baseEmbed = new EmbedBuilder().setColor(SIGameColor);

    await interaction.reply({
      embeds: [baseEmbed.setDescription(`Скачиваем пакет ${dto.id}...`)],
    });

    try {
      await this.sigameController.downloadPack(dto.id);

      const { pack } = await this.sigameController.startPack(
        interaction.guildId!,
        dto.id,
      );

      await interaction.editReply({
        embeds: [
          baseEmbed
            .setTitle(`Пакет ${pack.name} загружен!`)
            .setDescription(`Начинаем разыгровку...`),
        ],
      });

      await this.askQuestion(interaction.guildId!);
    } catch (error) {
      this.logger.error(`Failed to download pack ${dto.id}: ${error}`);
      await interaction.editReply({
        embeds: [
          baseEmbed
            .setTitle(`Ошибка при загрузке пакета`)
            .setDescription(
              `Не удалось загрузить пакет. Пожалуйста, попробуйте снова позже или другой пакет.`,
            )
            .addFields(
              {
                name: 'Ошибка',
                value: String(error),
              },
              {
                name: 'Пакет',
                value: dto.id,
              },
            ),
        ],
      });
      return;
    }
  }

  @Subcommand({
    name: 'repeat',
    description: 'Повторить текущий вопрос SIGame',
  })
  async repeatQuestion(@Context() [interaction]: SlashCommandContext) {
    const guildId = interaction.guildId!;

    const isRunning = await this.sigameController.isGameRunning(guildId);
    if (!isRunning) {
      await interaction.reply({
        content: 'Нет активной игры SIGame.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply();

    await this.sigameController.restartPack(guildId);

    await interaction.editReply({
      content: 'Повторяю текущий вопрос...',
    });

    await this.askQuestion(guildId);
  }

  @On('messageCreate')
  async handleAnswer(@Context() [message]: ContextOf<'messageCreate'>) {
    const guildId = message.guildId;
    const channelId = message.channelId;

    if (!message.guild || message.author.bot) return;
    if (!guildId || !channelId) return;

    const game = await this.getGame(guildId, channelId).catch(() => null);
    if (!game) return;

    if (this._answerLocks.get(guildId)) return;
    this._answerLocks.set(guildId, true);

    setTimeout(() => {
      this._answerLocks.delete(guildId);
    }, 10);

    const { question } = game.getCurrentState()!;

    const text = message.content.trim();
    if (text.length === 0) return;

    if (['скип', 'суип', 'skip'].includes(text.toLowerCase())) {
      const { embed, files } = SIGameEmbedBuilder.buildAnswer(question);

      embed.setDescription('Пропускаем вопрос...\n\n' + embed.data.description);

      await message.reply({
        embeds: [embed],
        files,
      });

      return this.askNextQuestion(guildId);
    }

    const lowerText = text.toLowerCase();

    if (
      ['подсказка', 'hint', 'хинт'].includes(lowerText) ||
      lowerText.startsWith('подска')
    ) {
      const hint = game.getHint();
      await message.reply({
        embeds: [
          {
            color: SIGameColor,
            description: `Подсказка: \`${hint}\`.`,
          },
        ],
      });
      return;
    }

    const answer = this.answerChecker.check(
      text,
      question.answer.flatMap((a) => String(a.text)),
    );

    if (answer == Answer.Incorrect) {
      return;
    }

    if (answer == Answer.Partial) {
      await message.reply({
        embeds: [
          {
            color: SIGameColor,
            description: `<@${message.author.id}>, почти угадали! Попробуйте еще раз.`,
          },
        ],
      });
      return;
    }

    const reward = question.price;

    const { embed, files } = SIGameEmbedBuilder.buildAnswer(question);

    const description =
      answer == Answer.Correct
        ? `<@${message.author.id}>, верно!`
        : `<@${message.author.id}>, засчитано!`;

    embed.setDescription(description + '\n\n' + embed.data.description);
    embed.setFooter({ text: `Награда +${reward}` });
    await message.reply({
      embeds: [embed],
      files,
    });

    game.addPlayerScore(message.author.id, reward);
    game.resetHints();
    await this.sigameController.saveGameState(guildId, game);

    await this.awardUser(message.author.id, guildId, reward);
    await this.askNextQuestion(guildId);
  }

  @Subcommand({
    name: 'end',
    description: 'Завершить текущую игру SIGame',
  })
  async commandEnd(@Context() [interaction]: SlashCommandContext) {
    const guildId = interaction.guildId!;

    const isRunning = await this.sigameController.isGameRunning(guildId);
    if (!isRunning) {
      await interaction.reply({
        content: 'Нет активной игры SIGame.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await this.endGame(guildId);

    await interaction.reply({
      content: 'Игра SIGame завершена.',
    });
  }

  private async endGame(guildId: DiscordID) {
    const state = await this.sigameController.getGameState(guildId);
    await this.sigameController.clearGameState(guildId);

    if (!state) return;

    const channel = await this.sigameController.getChannel(guildId);
    if (!channel) return;

    const playersScores = state.players;
    const sortedPlayers = Array.from(playersScores.entries()).sort(
      (a, b) => b[1] - a[1],
    );

    const scoreLines = sortedPlayers.map(
      ([userId, score]) => `<@${userId}>: ${score} очков`,
    );

    await channel.send({
      embeds: [
        {
          title: 'Игра окончена!',
          description: 'Поздравляем! Вы прошли весь пакет!',
          color: SIGameColor,
          fields: [
            {
              name: 'Лидеры по очкам',
              value:
                scoreLines.length > 0
                  ? scoreLines.join('\n')
                  : 'Никто не набрал очков.',
            },
          ],
        },
      ],
    });
  }

  private async askNextQuestion(guildId: DiscordID) {
    const game = await this.sigameController.getGameState(guildId);
    if (!game) return;

    const hasNext = game.nextQuestion();
    await this.sigameController.saveGameState(guildId, game);

    if (hasNext) {
      await this.askQuestion(guildId);
    } else {
      await this.endGame(guildId);
    }
  }

  private async askQuestion(guildId: DiscordID) {
    const channel = await this.sigameController.getChannel(guildId);
    if (!channel) return;

    const game = await this.sigameController.getGameState(guildId);
    if (!game) return;

    const state = game.getCurrentState();
    if (!state) return;

    const { embed, files } = SIGameEmbedBuilder.buildQuestion(game)!;

    await channel.send({
      embeds: [embed],
      files,
    });
  }

  private async awardUser(
    userId: DiscordID,
    guildId: DiscordID,
    amount: number,
  ) {
    const user = await this.userService.findOrCreate(guildId, userId);
    await this.userService.addCoins(user, amount);
  }

  private async getGame(guildId: DiscordID, channelId: DiscordID) {
    const channel = await this.sigameController.getChannel(guildId);
    if (!channel) return null;
    if (channel.id !== channelId) return null;

    const game = await this.sigameController.getGameState(guildId);
    return game;
  }
}
