import { Injectable, Logger, UseInterceptors } from '@nestjs/common';
import {
  Client,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  SendableChannels,
} from 'discord.js';
import Redis from 'ioredis';
import {
  Context,
  type ContextOf,
  createCommandGroupDecorator,
  On,
  Options,
  type SlashCommandContext,
  Subcommand,
} from 'necord';

import { GuildSettings } from '#config/guilds';
import { GuildSettingsService } from '#core/guilds/settings/guild-settings.service';
import { UserService } from '#core/users/users.service';
import { DiscordID } from '#root/lib/types';

import { Answer, AnswerChecker } from './utils/answer-checker';
import {
  SIGamePackAutocompleteInterceptor,
  SIGameSearchDTO,
} from './sigame.autocomplete';
import { SIGameService } from './sigame.service';
import { SIGameParsed, SIGameQuestion } from './sigame.type';

const SIGameColor = 0x030751;
const SIGameAvatar =
  'https://github.com/VladimirKhil/SIOnline/blob/master/assets/images/sigame.png?raw=true';

const SICommandDecorator = createCommandGroupDecorator({
  name: 'sigame',
  description: 'SIGame commands',
  contexts: [InteractionContextType.Guild],
});

interface GameState {
  packId: number;
  currentRoundIndex: number;
  currentThemeIndex: number;
  currentQuestionIndex: number;
  playersScores: Record<string, number>;
}

@Injectable()
@SICommandDecorator()
export class SIGamePlayer {
  private readonly logger = new Logger(SIGamePlayer.name);

  /// Map of active game packs by guild ID
  private readonly packs = new Map<DiscordID, SIGameParsed>();
  private readonly hints = new Map<DiscordID, number>();

  private readonly _cachedChannels = new Map<DiscordID, SendableChannels>();

  private readonly lockCheckAnswer = new Map<DiscordID, boolean>();

  constructor(
    private readonly sigameService: SIGameService,
    private readonly discord: Client,
    private readonly guildSettings: GuildSettingsService,
    private readonly redis: Redis,
    private readonly userService: UserService,
    private readonly answerChecker: AnswerChecker,
  ) {}

  private isLockedCheckAnswer(guildId: DiscordID) {
    return this.lockCheckAnswer.get(guildId) ?? false;
  }
  private setLockedCheckAnswer(guildId: DiscordID, value: boolean) {
    this.lockCheckAnswer.set(guildId, value);
  }

  @UseInterceptors(SIGamePackAutocompleteInterceptor)
  @Subcommand({
    name: 'start',
    description: 'Начать игру с SIGame пакетом',
  })
  async startGameCommand(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: SIGameSearchDTO,
  ) {
    const isRunning = await this.getGameState(interaction.guildId!);
    if (isRunning) {
      await interaction.reply({
        content:
          'Игра SIGame уже запущена в этом сервере. Завершите её перед началом новой.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply();

    const packId = Number(dto.id);
    const pack = await this.sigameService.getPackById(packId).catch(() => null);
    if (!pack) {
      await interaction.editReply({
        content: `Пакет с ID ${packId} не найден.`,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(SIGameColor)
      .setDescription(`Скачиваем пакет ${pack.name}...`);
    await interaction.editReply({ embeds: [embed] });
    try {
      await this.sigameService.downloadPack(pack);
    } catch (error) {
      this.logger.error(`Failed to download pack ${packId}: ${error}`);
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setColor(SIGameColor)
            .setTitle(`Ошибка при загрузке пакета ${pack.name}`)
            .setDescription(
              `Не удалось загрузить пакет. Пожалуйста, попробуйте снова позже или другой пакет.`,
            ),
        ],
      });
      return;
    }

    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(SIGameColor)
          .setTitle(`Пакет ${pack.name} загружен!`)
          .setDescription(`Начинаем разыгровку...`),
      ],
    });
    await this.startGame(interaction.guildId!, packId);
  }

  @Subcommand({
    name: 'repeat',
    description: 'Повторить текущий вопрос SIGame',
  })
  async repeatQuestion(@Context() [interaction]: SlashCommandContext) {
    const guildId = interaction.guildId!;

    const state = await this.getGameState(guildId);
    if (!state) {
      await interaction.reply({
        content: 'Нет активной игры SIGame.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply();

    await this.startGame(guildId, state.packId);

    await interaction.editReply({
      content: 'Повторяю текущий вопрос...',
    });
  }

  async startGame(guildId: DiscordID, packId: number) {
    const channel = await this.getChannel(guildId);
    const state = await this.getGameState(guildId);

    if (state) {
      this.logger.log(
        `Resuming SIGame for guild ${guildId} at pack ${state.packId}, round ${state.currentRoundIndex}, theme ${state.currentThemeIndex}, question ${state.currentQuestionIndex}`,
      );

      const isLoaded = this.packs.has(guildId);
      if (!isLoaded) {
        const pack = await this.sigameService.getPackById(state.packId);
        await this.sigameService.downloadPack(pack);
        try {
          const parsed = await this.sigameService.parsePack(state.packId);
          this.packs.set(guildId, parsed);
        } catch (error) {
          this.logger.error(`Failed to parse pack ${state.packId}: ${error}`);
          await channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(SIGameColor)
                .setTitle(`Ошибка при загрузке пакета`)
                .setDescription(
                  `Не удалось загрузить пакет. Пожалуйста, попробуйте другой пакет.`,
                ),
            ],
          });
          return;
        }
      }

      await this.askQuestion(guildId);
    } else {
      this.logger.log(`Starting new SIGame for guild ${guildId}`);
      await this.setGameState(guildId, {
        packId,
        currentRoundIndex: 0,
        currentThemeIndex: 0,
        currentQuestionIndex: 0,
        playersScores: {},
      });

      const pack = await this.sigameService.parsePack(packId);
      this.packs.set(guildId, pack);

      const embed = new EmbedBuilder()
        .setTitle(pack.name)
        .setColor(SIGameColor)
        .setDescription(pack.description);

      embed.addFields(
        {
          name: 'Количество раундов',
          value: `${pack.stats.rounds}`,
          inline: true,
        },
        { name: 'Количество тем', value: `${pack.stats.themes}`, inline: true },
        {
          name: 'Количество вопросов',
          value: `${pack.stats.questions}`,
          inline: true,
        },
      );

      await channel.send({
        embeds: [embed],
      });

      await this.askQuestion(guildId);
    }
  }

  @On('messageCreate')
  async handleAnswer(@Context() [message]: ContextOf<'messageCreate'>) {
    const guildId = message.guildId;
    const channelId = message.channelId;

    if (this.isLockedCheckAnswer(guildId!)) return;

    if (!message.guild || message.author.bot) return;

    if (!guildId) return;
    const channel = await this.getChannel(guildId).catch(() => null);
    if (!channel) return;
    if (channel.id !== channelId) return;
    const state = await this.getGameState(guildId);
    if (!state) return;

    const pack = await this.getCurrentPack(guildId);

    const round = pack.rounds[state.currentRoundIndex];
    if (!round) return;
    const theme = round.themes[state.currentThemeIndex];
    if (!theme) return;
    const question = theme.questions[state.currentQuestionIndex];
    if (!question) return;

    const user = await this.userService.findOrCreate(
      guildId,
      message.author.id,
    );

    const text = message.content.trim();
    if (text.length === 0) return;

    if (['скип', 'суип', 'skip'].includes(text.toLowerCase())) {
      const { embed, files } = this.getAnswerEmbed(question);

      embed.setDescription('Пропускаем вопрос...\n\n' + embed.data.description);

      await message.reply({
        embeds: [embed],
        files,
      });
      this.setLockedCheckAnswer(guildId, true);
      return this.askNextQuestion(guildId);
    }

    if (['подсказка', 'hint'].includes(text.toLowerCase())) {
      const hint = this.getHint(guildId, question.right.answers[0]);
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

    const answer = this.answerChecker.check(text, question.right.answers);

    this.logger.debug({
      text,
      answer: question.right.answers,
      result: Answer[answer],
    });

    if (answer == Answer.Incorrect) {
      if (text.startsWith('подска'))
        await message.reply({
          embeds: [
            {
              color: SIGameColor,
              description: `Подсказка: \`${this.getHint(guildId, question.right.answers[0])}\`.`,
            },
          ],
        });
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
    this.setLockedCheckAnswer(guildId, true);

    const reward = question.price;

    const { embed, files } = this.getAnswerEmbed(question);

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

    state.playersScores[message.author.id] =
      (state.playersScores[message.author.id] ?? 0) + reward;
    await this.setGameState(guildId, state);
    await this.userService.addCoins(user, reward);
    await this.askNextQuestion(guildId);
    this.hints.set(guildId, 0);
    this.setLockedCheckAnswer(guildId, false);
  }

  @Subcommand({
    name: 'end',
    description: 'Завершить текущую игру SIGame',
  })
  async commandEnd(@Context() [interaction]: SlashCommandContext) {
    const guildId = interaction.guildId!;

    const state = await this.getGameState(guildId);
    if (!state) {
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

  private async askNextQuestion(guildId: DiscordID) {
    const { state, theme, round, pack } =
      await this.getCurrentQuestion(guildId);

    state.currentQuestionIndex += 1;
    if (state.currentQuestionIndex >= theme.questions.length) {
      state.currentQuestionIndex = 0;
      state.currentThemeIndex += 1;
      if (state.currentThemeIndex >= round.themes.length) {
        state.currentThemeIndex = 0;
        state.currentRoundIndex += 1;
        if (state.currentRoundIndex >= pack.rounds.length) {
          await this.endGame(guildId);
          return;
        }
      }
    }
    this.hints.set(guildId, 0);
    await this.setGameState(guildId, state);
    await this.askQuestion(guildId);
    this.setLockedCheckAnswer(guildId, false);
  }

  private async endGame(guildId: DiscordID) {
    const state = await this.getGameState(guildId);
    await this.clearGameState(guildId);

    const channel = await this.getChannel(guildId);

    const playersScores = state?.playersScores ?? {};
    const sortedPlayers = Object.entries(playersScores).sort(
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

  private async askQuestion(guildId: DiscordID) {
    const { question, state, theme, round, pack } =
      await this.getCurrentQuestion(guildId);

    const hasEnglish = question.right.answers
      ? /[A-Za-z]/g.test(question.right.answers.join(''))
      : false;
    const hasRussian = question.right.answers
      ? /[А-Яа-яЁё]/g.test(question.right.answers.join(''))
      : false;
    const hasNumbers = question.right.answers
      ? /[0-9]/g.test(question.right.answers.join(''))
      : false;

    const embed = new EmbedBuilder()
      .setColor(SIGameColor)
      .setAuthor({
        name: `Тема: ${theme.name} (${state.currentQuestionIndex + 1}/${theme.questions.length})`,
        iconURL: SIGameAvatar,
      })
      .setFooter({
        text: `${round.name} | ${question.price} | ${pack.name}`,
      });

    let description = '';

    if (question.scenarios.length > 0) {
      /// add all scenarios text and embeds
      for (const scenario of question.scenarios) {
        if (scenario.text) {
          description += `❓ ${scenario.text}\n\n`;
        }
      }
    }
    const languages: string[] = [];
    if (hasEnglish) languages.push('🇺🇸');
    if (hasRussian) languages.push('🇷🇺');
    if (hasNumbers) languages.push('🔢');
    description += `Язык: ${languages.join('/')}`;

    embed.setDescription(description);

    const files: { attachment: string; name: string }[] = [];

    if (question.scenarios.length === 1 && question.scenarios[0].embed) {
      const ext = question.scenarios[0].embed.split('.').pop()!;
      if (/(mp4|mov|webm)/i.exec(ext)) {
        embed.data.video = {
          url: `attachment://question.${ext}`,
        };
      } else {
        embed.setImage(`attachment://question.${ext}`);
      }
    }

    for (const scenario of question.scenarios) {
      /// add all scenario embeds
      if (scenario.embed) {
        const ext = scenario.embed.split('.').pop()!;
        files.push({
          attachment: scenario.embed,
          name: `question.${ext}`,
        });
      }
    }

    const channel = await this.getChannel(guildId);
    try {
      await channel.send({ embeds: [embed], files });
    } catch (error) {
      this.logger.error(
        `Failed to send question in guild ${guildId}: ${error}`,
      );
      await this.askNextQuestion(guildId);
    }
  }

  private getHint(guildId: DiscordID, rightAnswer: string) {
    if (!guildId) return false;

    let hintCount = this.hints.get(guildId) ?? 0;

    if (hintCount < rightAnswer.length) {
      hintCount += 1;
      this.hints.set(guildId, hintCount);

      let openLetters = ' ';
      let hintMessage = '';

      for (let i = 0; i < rightAnswer.length; i++) {
        const char = rightAnswer[i];

        if (i < hintCount) {
          hintMessage += char;
          openLetters += char;
        } else if (openLetters.includes(char)) hintMessage += char;
        else hintMessage += '*';
      }

      return hintMessage;
    } else return rightAnswer;
  }

  private async getCurrentPack(guildId: DiscordID) {
    let pack = this.packs.get(guildId);
    if (!pack) {
      const state = await this.getGameState(guildId);
      if (!state) {
        throw new Error('No active SIGame for this guild');
      }
      pack = await this.sigameService.parsePack(state.packId);
      this.packs.set(guildId, pack);
    }
    return pack;
  }

  private async getChannel(guildId: DiscordID): Promise<SendableChannels> {
    if (this._cachedChannels.has(guildId)) {
      return this._cachedChannels.get(guildId)!;
    }
    const channelId = await this.guildSettings.getSetting<string>(
      guildId,
      GuildSettings.SIGameChannelId,
    );
    if (!channelId) {
      throw new Error('SIGame channel not configured for this guild');
    }
    const guild = await this.discord.guilds.fetch(String(guildId));
    const channel = await guild.channels.fetch(channelId);
    if (!channel?.isSendable()) {
      throw new Error('Configured SIGame channel is not sendable');
    }
    this._cachedChannels.set(guildId, channel as SendableChannels);
    return channel;
  }

  private async getGameState(guildId: DiscordID) {
    const stateKey = `sigame:state:${guildId}`;
    const stateData = await this.redis.get(stateKey);
    if (!stateData) {
      return null;
    }
    return JSON.parse(stateData) as GameState;
  }
  private async setGameState(guildId: DiscordID, state: GameState) {
    const stateKey = `sigame:state:${guildId}`;
    await this.redis.set(stateKey, JSON.stringify(state));
  }

  private async clearGameState(guildId: DiscordID) {
    const state = await this.getGameState(guildId);
    if (!state) {
      throw new Error('Game state not found');
    }
    const stateKey = `sigame:state:${guildId}`;
    await this.redis.del(stateKey);
    this.packs.delete(guildId);
    this.hints.delete(guildId);
    await this.sigameService.deletePack(state.packId);
  }

  private getAnswerEmbed(question: SIGameQuestion) {
    const files: { attachment: string; name: string }[] = [];

    for (const embed of question.right.embeds ?? []) {
      const ext = embed.split('.').pop()?.toLowerCase();
      files.push({
        attachment: embed,
        name: `question.${ext}`,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(SIGameColor)
      .setDescription(`Ответ: \`${question.right.answers.join(', ')}\`.`);

    if (question.scenarios.length === 1 && question.scenarios[0].embed) {
      const ext = question.scenarios[0].embed.split('.').pop()!;
      if (/(mp4|mov|webm)/i.exec(ext)) {
        embed.data.video = {
          url: `attachment://question.${ext}`,
        };
      } else if (/jpg|jpeg|png|gif/i.exec(ext)) {
        embed.setImage(`attachment://question.${ext}`);
      }
    }

    return { embed, files };
  }

  private async getCurrentQuestion(guildId: DiscordID) {
    const state = await this.getGameState(guildId);
    if (!state) {
      throw new Error('No active SIGame for this guild');
    }
    const pack = await this.getCurrentPack(guildId);
    if (!pack) {
      throw new Error('Pack not found');
    }

    const round = pack.rounds[state.currentRoundIndex];
    if (!round) {
      throw new Error('No rounds available');
    }
    const theme = round.themes[state.currentThemeIndex];
    if (!theme) {
      throw new Error('No themes available');
    }

    const question = theme.questions[state.currentQuestionIndex];
    if (!question) {
      throw new Error('No questions available');
    }

    return { question, pack, round, theme, state };
  }
}
