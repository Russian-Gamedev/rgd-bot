export class SIGamePack {
  public name: string;
  public description: string;
  public date: string;
  public logo: string;

  public rounds: SIGameRound[] = [];

  setFileMap(files: Record<string, string>) {
    for (const round of this.rounds) {
      for (const theme of round.themes) {
        for (const question of theme.questions) {
          for (const embed of [...question.question, ...question.answer]) {
            embed.files = embed.files.map((file) => files[file] || file);
          }
        }
      }
    }
  }
}

export class SIGameRound {
  public name: string;
  public themes: SIGameTheme[] = [];
}

export class SIGameTheme {
  public name: string;
  public questions: SIGameQuestion[] = [];
}

export type SIGameQuestionType = 'content' | 'select';

export class SIGameQuestion {
  answer: SIGameEmbed[] = [];
  question: SIGameEmbed[] = [];
  price: number;
  type: SIGameQuestionType = 'content';
}

export class SIGameEmbed {
  text: string[] = [];
  files: string[] = [];
}
