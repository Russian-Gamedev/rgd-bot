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

import { EmojiCoin } from '#config/emojies';
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
}

@Injectable()
@SICommandDecorator()
export class SIGamePlayer {
  private readonly logger = new Logger(SIGamePlayer.name);

  /// Map of active game packs by guild ID
  private readonly packs = new Map<DiscordID, SIGameParsed>();
  private readonly hints = new Map<DiscordID, string>();

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

    const packId = Number(dto.id);
    const pack = await this.sigameService.getPackById(packId).catch(() => null);
    if (!pack) {
      await interaction.reply({
        content: `Пакет с ID ${packId} не найден.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(SIGameColor)
      .setDescription(`Скачиваем пакет ${pack.name}...`);
    await interaction.reply({ embeds: [embed] });
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

    await this.startGame(guildId, state.packId);

    await interaction.reply({
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
        const pack = await this.sigameService.parsePack(state.packId);
        this.packs.set(guildId, pack);
      }

      await this.askQuestion(guildId);
    } else {
      this.logger.log(`Starting new SIGame for guild ${guildId}`);
      await this.setGameState(guildId, {
        packId,
        currentRoundIndex: 0,
        currentThemeIndex: 0,
        currentQuestionIndex: 0,
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

    if (!message.reference) return;
    const referencedMessage = await message.channel.messages.fetch(
      message.reference.messageId!,
    );
    if (!referencedMessage) return;
    /// if reply is not to this bot
    if (referencedMessage.author?.id !== this.discord.user?.id) return;
    if (!guildId) return;
    const channel = await this.getChannel(guildId);
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

    const userAnswer = message.content.trim().toLowerCase();
    const rightAnswer = question.right.answer.trim().toLowerCase();

    const wordsUser = userAnswer.split(' ');
    const wordsRight = rightAnswer.split(' ');

    let correct = 0;

    for (const word of wordsUser) {
      if (wordsRight.includes(word)) {
        correct += 1;
      } else {
        for (const rightWord of wordsRight) {
          const distance = levenshtein(word, rightWord);
          const similarity =
            1 - distance / Math.max(word.length, rightWord.length);
          if (similarity >= 0.5) {
            correct += 1;
          }
        }
      }
    }

    const percent = correct / wordsRight.length;

    const reward = Math.floor(question.price * percent);

    const miss = async () => {
      let hints = this.hints.get(guildId) ?? '';

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

        await message.reply({
          embeds: [
            {
              color: SIGameColor,
              description: `Подсказка: \`${hint}\``,
            },
          ],
        });

        this.hints.set(guildId, hints);
      } else {
        this.hints.set(guildId, '');
        await this.askNextQuestion(guildId);
      }
    };

    let isCorrect = false;

    if (percent < 0.1) {
      await message.reply({
        embeds: [
          {
            color: SIGameColor,
            description: `<@${message.author.id}>, абсолютно неверно.`,
          },
        ],
      });
    } else if (percent < 0.5) {
      await message.reply({
        embeds: [
          {
            color: SIGameColor,
            description: `<@${message.author.id}>, кажется близок к ответу`,
          },
        ],
      });
    } else if (percent < 0.75) {
      isCorrect = true;
      await message.reply({
        embeds: [
          {
            color: SIGameColor,
            description: `<@${message.author.id}>, не совсем, но засчитываю!`,
            footer: { text: `Награда +${reward} ${EmojiCoin.Top}` },
          },
        ],
      });
      await this.userService.addCoins(user, reward);
      await this.askNextQuestion(guildId);
      this.hints.set(guildId, '');
    } else {
      isCorrect = true;
      await message.reply({
        embeds: [
          {
            color: SIGameColor,
            description: `<@${message.author.id}>, абсолютно верно!`,
            footer: { text: `Награда +${reward} ${EmojiCoin.Top}` },
          },
        ],
      });
    }
    if (isCorrect) {
      await this.userService.addCoins(user, reward);
      await this.askNextQuestion(guildId);
      this.hints.set(guildId, '');
    } else {
      await miss();
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
    this.hints.set(guildId, '');
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

    await this.clearGameState(guildId);

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
          await this.clearGameState(guildId);

          const channel = await this.getChannel(guildId);
          await channel.send({
            embeds: [
              {
                title: 'Игра окончена!',
                description: 'Поздравляем! Вы прошли весь пакет!',
                color: SIGameColor,
              },
            ],
          });
          return;
        }
      }
    }

    await this.setGameState(guildId, state);
    await this.askQuestion(guildId);
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

    const embed = new EmbedBuilder()
      .setColor(SIGameColor)
      .setAuthor({
        name: `Раунд: ${round.name} | Тема: ${theme.name} | Вопрос: ${state.currentQuestionIndex + 1}/${theme.questions.length}`,
        iconURL:
          'https://github.com/VladimirKhil/SIOnline/blob/master/assets/images/sigame.png?raw=true',
      })
      .setFooter({
        text: `Цена вопроса: ${question.price} ${EmojiCoin.Top}`,
      });

    if (question.scenario.text) {
      embed.setDescription(`❓ ${question.scenario.text}`);
    } else if (question.scenario.embed) {
      embed.setDescription(`❓ Вопрос представлен в виде медиафайла`);
    }

    const files: { attachment: string; name: string }[] = [];

    if (question.scenario.embed) {
      const ext = question.scenario.embed.split('.').pop()!;
      files.push({
        attachment: question.scenario.embed,
        name: `question.${ext}`,
      });
    }

    const channel = await this.getChannel(guildId);
    await channel.send({ embeds: [embed], files });
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
}
