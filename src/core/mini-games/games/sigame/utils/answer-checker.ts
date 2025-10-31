import { Injectable } from '@nestjs/common';

export enum Answer {
  Incorrect,
  Partial,
  Acceptable,
  Correct,
}

@Injectable()
export class AnswerChecker {
  private readonly numbers: Record<string, string> = {
    один: '1',
    два: '2',
    три: '3',
    четыре: '4',
    пять: '5',
    шесть: '6',
    семь: '7',
    восемь: '8',
    девять: '9',
    ноль: '0',
    десять: '10',
    одиннадцать: '11',
    двенадцать: '12',
    тринадцать: '13',
    сто: '100',
  };

  check(text: string, correct: string): Answer {
    // Easter egg for "РОССИЯ"
    if (text === 'РОССИЯ' && Math.random() < 0.02) {
      return Answer.Correct;
    }

    text = this.normalize(text);

    const splitResult = this.split(correct);
    if (splitResult.length > 1) {
      let result = Answer.Incorrect;
      for (const variant of splitResult) {
        result = this.max(
          result,
          this.checkNormalized(text, this.normalize(variant)),
        );
      }
      return result;
    }

    return this.checkNormalized(text, this.normalize(correct));
  }

  private normalize(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^а-яёa-z0-9]+/g, ' ')
      .trim()
      .replace(/([а-яёa-z])\1+/g, '$1');
  }

  private split(input: string): string[] {
    const matches = [...input.matchAll(/(.*?)(?:\((.*?)\)|$)/g)];
    const result = matches
      .flatMap((m) => [m[1], m[2]])
      .filter((s) => s && s !== '');

    if (result.some((s) => s !== input)) {
      return result;
    }
    return [input];
  }

  private checkNormalized(text: string, correct: string): Answer {
    const matchcheck = text.replace(/\s/g, '');
    const matchcheck2 = correct.replace(/\s/g, '');

    const ach1 = this.transliterateToRussian(
      this.transliterateToEnglish(matchcheck),
    );
    const ach2 = this.transliterateToRussian(
      this.transliterateToEnglish(matchcheck2),
    );

    // Substring matching with 70% threshold
    if (
      (matchcheck.length > 3 || matchcheck2.length <= 3) &&
      ach2.includes(ach1)
    ) {
      if (matchcheck.length / matchcheck2.length > 0.7) {
        return Answer.Correct;
      }
    }

    if (ach1 === ach2) {
      return Answer.Correct;
    }

    let wordsA = text.split(/\s+/);
    let wordsB = correct.split(/\s+/);

    // Prevent system overload
    if (wordsA.length > 10) {
      return Answer.Incorrect;
    }

    // Replace number words with digits
    for (let i = 0; i < wordsA.length; i++) {
      if (this.numbers[wordsA[i]]) {
        wordsA[i] = this.numbers[wordsA[i]];
      }
    }

    for (let i = 0; i < wordsB.length; i++) {
      if (this.numbers[wordsB[i]]) {
        wordsB[i] = this.numbers[wordsB[i]];
      }
    }

    // Check abbreviation (user answer is 1 word)
    if (wordsA.length === 1) {
      let abb = '';
      for (const word of wordsB) {
        abb += word[0];
      }
      if (wordsA[0] === abb) {
        return Answer.Correct;
      }
    }

    // Check abbreviation (correct answer is 1 word)
    if (wordsB.length === 1 && wordsA.length > 1) {
      let abb = '';
      for (const word of wordsA) {
        abb += word[0];
      }
      if (wordsB[0] === abb) {
        return Answer.Correct;
      }
    }

    // Filter out short words (length <= 2) unless they contain digits
    if (wordsB.length > 1) {
      const newA = wordsA.filter((w) => w.length > 2 || /\d/.test(w));
      const newB = wordsB.filter((w) => w.length > 2 || /\d/.test(w));

      if (newB.length > 0) {
        if (newA.length <= 0) {
          return Answer.Incorrect;
        }

        wordsA = newA;
        wordsB = newB;
      }
    }

    const correctThreshold = Math.min(wordsB.length, 2);
    const acceptThreshold = Math.max(wordsB.length - 1, 1);

    const correctPairs = this.countCorrectPairs(wordsA, wordsB);

    if (correctPairs >= correctThreshold) return Answer.Correct;
    else if (correctPairs >= acceptThreshold) return Answer.Acceptable;
    else if (correctPairs > 0) return Answer.Partial;

    return Answer.Incorrect;
  }

  private countCorrectPairs(words: string[], correct: string[]): number {
    let count = 0;
    const hash1 = new Set<string>();
    const hash2 = new Set<string>();

    for (const wordA of words) {
      for (const wordB of correct) {
        if (
          !hash1.has(wordA) &&
          !hash2.has(wordB) &&
          this.calculateSimilarity(wordA, wordB) > 0.7
        ) {
          hash1.add(wordA);
          hash2.add(wordB);
          count++;
        }
      }
    }

    return count;
  }

  private max(a: Answer, b: Answer): Answer {
    return a > b ? a : b;
  }

  private calculateSimilarity(word1: string, word2: string): number {
    if (!word1 || !word2) {
      return 0;
    }

    const normalized1 = this.normalizeWord(word1);
    const normalized2 = this.normalizeWord(word2);

    if (normalized1 === normalized2) {
      return 1.0;
    }

    const translit1 = this.transliterateToEnglish(normalized1);
    const translit2 = this.transliterateToEnglish(normalized2);
    const translitBack1 = this.transliterateToRussian(translit1);
    const translitBack2 = this.transliterateToRussian(translit2);

    let maxSimilarity = 0;
    maxSimilarity = Math.max(
      maxSimilarity,
      this.calculateLevenshteinSimilarity(normalized1, normalized2),
    );
    maxSimilarity = Math.max(
      maxSimilarity,
      this.calculateLevenshteinSimilarity(normalized1, translitBack2),
    );
    maxSimilarity = Math.max(
      maxSimilarity,
      this.calculateLevenshteinSimilarity(translitBack1, normalized2),
    );
    maxSimilarity = Math.max(
      maxSimilarity,
      this.calculateLevenshteinSimilarity(translit1, translit2),
    );
    maxSimilarity = Math.max(
      maxSimilarity,
      this.calculateLevenshteinSimilarity(normalized1, translit2),
    );
    maxSimilarity = Math.max(
      maxSimilarity,
      this.calculateLevenshteinSimilarity(translit1, normalized2),
    );

    return maxSimilarity;
  }

  private normalizeWord(word: string): string {
    return word
      .toLowerCase()
      .replace(/ё/g, 'е')
      .replace(/й/g, 'е')
      .replace(/и/g, 'е')
      .replace(/с/g, 'к')
      .replace(/о/g, 'а');
  }

  private transliterateToEnglish(word: string): string {
    const mapping: Record<string, string> = {
      а: 'a',
      б: 'b',
      в: 'v',
      г: 'g',
      д: 'd',
      е: 'e',
      ж: 'zh',
      з: 'z',
      и: 'e',
      й: 'y',
      к: 'k',
      л: 'l',
      м: 'm',
      н: 'n',
      о: 'a',
      п: 'p',
      р: 'r',
      с: 's',
      т: 't',
      у: 'u',
      ф: 'f',
      х: 'kh',
      ц: 'ts',
      ч: 'ch',
      ш: 'sh',
      щ: 'shch',
      ъ: '',
      ы: 'y',
      ь: '',
      э: 'e',
      ю: 'yu',
      я: 'ya',
    };

    return word
      .split('')
      .map((c) => mapping[c] || c)
      .join('');
  }

  private transliterateToRussian(word: string): string {
    const mapping: Record<string, string> = {
      shch: 'щ',
      kh: 'х',
      ts: 'ц',
      ch: 'ч',
      sh: 'ш',
      zh: 'ж',
      yu: 'ю',
      ya: 'я',
      ea: 'и',
      a: 'а',
      b: 'б',
      v: 'в',
      g: 'г',
      d: 'д',
      e: 'е',
      z: 'з',
      i: 'е',
      y: 'у',
      k: 'к',
      l: 'л',
      m: 'м',
      n: 'н',
      o: 'а',
      p: 'п',
      r: 'р',
      s: 'с',
      t: 'т',
      u: 'у',
      f: 'ф',
      c: 'к',
      h: 'х',
      j: 'ж',
      q: 'к',
      w: 'в',
      x: 'х',
    };

    const result: string[] = [];
    let i = 0;

    while (i < word.length) {
      let found = false;

      // Try multi-character combinations first
      for (const combo of [
        'shch',
        'kh',
        'ts',
        'ch',
        'sh',
        'zh',
        'yu',
        'ya',
        'ea',
      ]) {
        if (
          i + combo.length <= word.length &&
          word.substring(i, i + combo.length).toLowerCase() === combo
        ) {
          result.push(mapping[combo]);
          i += combo.length;
          found = true;
          break;
        }
      }

      if (!found) {
        const singleChar = word[i].toLowerCase();
        if (mapping[singleChar]) {
          result.push(mapping[singleChar]);
        } else {
          result.push(word[i]);
        }
        i++;
      }
    }

    return result.join('');
  }

  private calculateLevenshteinSimilarity(s1: string, s2: string): number {
    if (s1 === s2) return 1.0;

    const dp: number[][] = Array(s1.length + 1)
      .fill(null)
      .map(() => Array(s2.length + 1).fill(0));

    for (let i = 0; i <= s1.length; i++) {
      dp[i][0] = i;
    }
    for (let j = 0; j <= s2.length; j++) {
      dp[0][j] = j;
    }

    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
          dp[i - 1][j - 1] + cost,
        );
      }
    }

    const distance = dp[s1.length][s2.length];
    const maxLength = Math.max(s1.length, s2.length);

    return 1.0 - distance / maxLength;
  }
}
