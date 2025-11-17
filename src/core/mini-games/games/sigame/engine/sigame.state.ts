/*
  Вся логика мини-игры должна быть здесь
  Например, обработка вопросов, проверка ответов и т.д.
*/

import { SIGamePack } from './sigame.pack';

export class SIGameState {
  public currentRoundIndex = 0;
  public currentQuestionIndex = 0;
  public currentThemeIndex = 0;

  public hintCount = 0;

  public players = new Map<string, number>();

  constructor(public readonly pack: SIGamePack) {}

  getCurrentState() {
    const round = this.pack.rounds[this.currentRoundIndex];
    if (!round) return null;
    const theme = round.themes[this.currentThemeIndex];
    if (!theme) return null;
    const question = theme.questions[this.currentQuestionIndex];
    return { question, round, theme };
  }

  nextQuestion() {
    const round = this.pack.rounds[this.currentRoundIndex];
    if (!round) return false;
    const theme = round.themes[this.currentThemeIndex];
    if (!theme) return false;

    this.currentQuestionIndex++;
    if (this.currentQuestionIndex >= theme.questions.length) {
      this.currentQuestionIndex = 0;
      this.currentThemeIndex++;
      if (this.currentThemeIndex >= round.themes.length) {
        this.currentThemeIndex = 0;
        this.currentRoundIndex++;
        if (this.currentRoundIndex >= this.pack.rounds.length) {
          // Игра окончена
          return false;
        }
      }
    }
    this.resetHints();
    return true;
  }

  getHint() {
    const question = this.getCurrentState();
    if (!question) return null;
    const rightAnswer = question.question.answer
      .map((embed) => embed.text.join(' '))
      .join(', ');

    const toHide = /[A-Za-zА-Яа-яЁё0-9]/;
    const fill = '■';

    if (this.hintCount >= rightAnswer.length) {
      return rightAnswer;
    }

    this.hintCount++;

    let hintMessage = '';
    let hintOpenedLetters = '';

    for (const char of rightAnswer) {
      if (!toHide.test(char)) {
        hintOpenedLetters += char;
      }
    }

    for (let i = 0; i < rightAnswer.length; i++) {
      const char = rightAnswer[i];

      if (i < this.hintCount) {
        hintMessage += char;
        hintOpenedLetters += char;
      } else if (hintOpenedLetters.includes(char)) {
        hintMessage += char;
      } else {
        hintMessage += fill;
      }
    }
    return hintMessage;
  }

  addPlayerScore(playerId: string, score: number) {
    const currentScore = this.players.get(playerId) ?? 0;
    this.players.set(playerId, currentScore + score);
  }

  resetHints() {
    this.hintCount = 0;
  }

  serialize() {
    return {
      currentRoundIndex: this.currentRoundIndex,
      currentQuestionIndex: this.currentQuestionIndex,
      currentThemeIndex: this.currentThemeIndex,
      hintCount: this.hintCount,
    };
  }

  static deserialize(data: string, pack: SIGamePack) {
    const state = new SIGameState(pack);
    const parsedData = JSON.parse(data);
    state.currentRoundIndex = parsedData.currentRoundIndex;
    state.currentQuestionIndex = parsedData.currentQuestionIndex;
    state.currentThemeIndex = parsedData.currentThemeIndex;
    state.hintCount = parsedData.hintCount;

    state.players = new Map<string, number>(parsedData.players);
    return state;
  }
}
