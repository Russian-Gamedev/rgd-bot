import { SIGamePack } from '../sigame.pack';

export abstract class SIGamePackParser {
  abstract canParse(content: string): boolean;
  abstract parse(content: string): Promise<SIGamePack>;
}

export class SIGameParserFactory {
  constructor(private parsers: SIGamePackParser[]) {}

  getParser(content: string): SIGamePackParser | null {
    for (const parser of this.parsers) {
      if (parser.canParse(content)) {
        return parser;
      }
    }
    return null;
  }
}
