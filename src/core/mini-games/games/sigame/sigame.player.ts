import { Injectable, Logger, UseInterceptors } from '@nestjs/common';
import {
  Client,
  EmbedBuilder,
  InteractionContextType,
  Message,
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
import { levenshtein } from '#root/lib/levenshtein';
import { DiscordID } from '#root/lib/types';

import {
  SIGamePackAutocompleteInterceptor,
  SIGameSearchDTO,
} from './sigame.autocomplete';
import { SIGameService } from './sigame.service';
import { SIGameParsed } from './sigame.type';

const SIGameColor = 0x030751;

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
  private readonly hints = new Map<DiscordID, [number, string]>();

  private readonly _cachedChannels = new Map<DiscordID, SendableChannels>();

  constructor(
    private readonly sigameService: SIGameService,
    private readonly discord: Client,
    private readonly guildSettings: GuildSettingsService,
    private readonly redis: Redis,
    private readonly userService: UserService,
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
        const parsed = await this.sigameService.parsePack(state.packId);
        this.packs.set(guildId, parsed);
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

    if (['скип', 'skip'].includes(text.toLowerCase())) {
      await message.reply({
        content: 'Пропускаем вопрос...',
      });
      return this.askNextQuestion(guildId);
    }

    const percent = this.checkAnswer(text, question.right.answer);

    let isCorrect = false;
    let reward = question.price;

    if (percent > 0.9) {
      isCorrect = true;
      await message.reply({
        embeds: [
          {
            color: SIGameColor,
            description: `<@${message.author.id}>, абсолютно верно!`,
            footer: { text: `Награда +${reward}` },
          },
        ],
      });
    } else if (percent > 0.7) {
      isCorrect = true;
      reward = Math.floor(reward / 2);
      await message.reply({
        embeds: [
          {
            color: SIGameColor,
            description: `<@${message.author.id}>, не совсем, но засчитываю!`,
            footer: { text: `Награда +${reward}` },
          },
        ],
      });
    } else if (percent > 0.4) {
      await message.reply({
        embeds: [
          {
            color: SIGameColor,
            description: `<@${message.author.id}>, почти угадали! Попробуйте еще раз.`,
          },
        ],
      });
    } else {
      const hint = this.checkMiss(message, question.right.answer);
      if (hint) {
        await message.reply({
          embeds: [
            {
              color: SIGameColor,
              description: `Подсказка: \`${hint}\`.`,
            },
          ],
        });
      }
    }

    if (isCorrect) {
      state.playersScores[message.author.id] =
        (state.playersScores[message.author.id] ?? 0) + reward;
      await this.setGameState(guildId, state);
      await this.userService.addCoins(user, reward);
      await this.askNextQuestion(guildId);
      this.hints.set(guildId, [0, '']);
    }
  }

  @Subcommand({
    name: 'skip',
    description: 'Пропустить текущий вопрос SIGame',
  })
  async commandSkip(@Context() [interaction]: SlashCommandContext) {
    const guildId = interaction.guildId!;

    const state = await this.getGameState(guildId);
    if (!state) {
      await interaction.reply({
        content: 'Нет активной игры SIGame.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      content: 'Пропускаем вопрос...',
    });
    this.hints.set(guildId, [0, '']);
    await this.askNextQuestion(guildId);
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

    const channel = await this.getChannel(guildId);

    await channel.send({
      embeds: [
        {
          color: SIGameColor,
          description: `Следующий вопрос, а ответом на этот был \`${theme.questions[state.currentQuestionIndex].right.answer}\`.`,
        },
      ],
    });

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

    await this.setGameState(guildId, state);
    await this.askQuestion(guildId);
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

    const isEnglish = question.right.answer
      ? /^[A-Za-z0-9:. -]*$/.test(question.right.answer)
      : false;

    const embed = new EmbedBuilder()
      .setColor(SIGameColor)
      .setAuthor({
        name: `Раунд: ${round.name} | Тема: ${theme.name} | Вопрос: ${state.currentQuestionIndex + 1}/${theme.questions.length}`,
        iconURL:
          'https://github.com/VladimirKhil/SIOnline/blob/master/assets/images/sigame.png?raw=true',
      })
      .setFooter({
        text: `Цена вопроса: ${question.price}`,
      });

    let description = '';

    if (question.scenario.text) {
      description = `❓ ${question.scenario.text}`;
    } else if (question.scenario.embed) {
      description = `❓ Вопрос представлен в виде медиафайла`;
    }

    description += `\n\nОтвет на: **${isEnglish ? 'английском' : 'русском'}** языке.`;

    embed.setDescription(description);

    const files: { attachment: string; name: string }[] = [];

    if (question.scenario.embed) {
      const ext = question.scenario.embed.split('.').pop()!;
      files.push({
        attachment: question.scenario.embed,
        name: `question.${ext}`,
      });
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

  private checkMiss(message: Message, rightAnswer: string) {
    const guildId = message.guildId;
    if (!guildId) return false;

    let [hintCount, hints] = this.hints.get(guildId) ?? [0, ''];

    hintCount += 1;
    this.hints.set(guildId, [hintCount, hints]);

    if (hintCount < 5) {
      return false;
    }

    if (hints.length < Math.min(5, rightAnswer.length)) {
      while (true) {
        const index = Math.floor(Math.random() * rightAnswer.length);
        const char = rightAnswer[index];
        if (char === ' ' || hints.includes(char)) {
          continue;
        }
        hints += char;
        break;
      }

      let hint = '';

      for (const char of rightAnswer) {
        if (char === ' ' || hints.includes(char)) {
          hint += char;
        } else {
          hint += '*';
        }
      }
      this.hints.set(guildId, [hintCount, hints]);

      return hint;
    }
    this.hints.set(guildId, [0, '']);
    return false;
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

  private normalizeWord(word: string) {
    return word
      .toLowerCase()
      .replace(/[.,!?;:"'()\-–—]/g, '')
      .replace(/([a-zа-я])(\d)/gi, '$1 $2') // вставляем пробел между буквами и цифрами
      .replace(/(\d)([a-zа-я])/gi, '$1 $2')
      .replace(/(.)\1{2,}/g, '$1') // убираем повторы букв
      .trim();
  }

  private normalizeAnswer(answer: string) {
    return answer
      .toLowerCase()
      .replace(/[.,!?;:"'()\-–—]/g, '')
      .replace(/([a-zа-я])(\d)/gi, '$1 $2')
      .replace(/(\d)([a-zа-я])/gi, '$1 $2')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private similartiy(a: string, b: string) {
    a = this.normalizeWord(a);
    b = this.normalizeWord(b);
    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;
    const distance = levenshtein(a, b);
    return 1 - distance / Math.max(a.length, b.length);
  }

  private checkAnswer(userAnswer: string, rightAnswer: string) {
    let wordsA: string[] = this.normalizeAnswer(userAnswer)
      .split(/\s+/)
      .map(this.normalizeWord.bind(this));
    const wordsB: string[] = this.normalizeAnswer(rightAnswer)
      .split(/\s+/)
      .map(this.normalizeWord.bind(this));

    /// filter trash
    wordsA = wordsA.filter((w) => w.length > 0);

    const uniqueWordsA: string[] = [];

    for (const w of wordsA) {
      const isDuplicate = uniqueWordsA.some((u) => this.similartiy(w, u) > 0.9);
      if (!isDuplicate) uniqueWordsA.push(w);
    }

    const repetitionPenalty = uniqueWordsA.length / Math.max(wordsA.length, 1);

    const usedA = new Set<number>();

    let total = 0;

    for (const wordB of wordsB) {
      let best = 0;
      let bestIndex = -1;

      for (let i = 0; i < uniqueWordsA.length; i++) {
        if (usedA.has(i)) continue;
        const sim = this.similartiy(uniqueWordsA[i], wordB);
        if (sim > best) {
          best = sim;
          bestIndex = i;
        }
      }

      if (bestIndex !== -1) usedA.add(bestIndex);
      total += best;
    }

    let score = (total / wordsB.length) * repetitionPenalty;

    // Дополнительная проверка для цифр
    const numsA = (userAnswer.match(/\d+/g) ?? []).join(' ');
    const numsB = (rightAnswer.match(/\d+/g) ?? []).join(' ');

    if (numsA && numsB) {
      if (numsA !== numsB) {
        score *= 0.85; // штраф за неверную цифру
      }
    } else if (!numsA && numsB) {
      score *= 0.9; // штраф за отсутствие числа
    }

    this.logger.debug({
      userAnswer,
      rightAnswer,
      wordsA: uniqueWordsA,
      wordsB,
      total,
      repetitionPenalty,
      score,
    });

    return score;
  }
}
