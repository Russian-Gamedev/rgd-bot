export interface SIGamePack {
  id: number;
  downloadCount: number;
  logoUri: string;
  name: string;
  directContentUri: string;
  size: number;
}

export interface SIGameTag {
  name: string;
}

export const SIGameSortMode = {
  Name: 0,
  DatePublished: 1,
};

export const SIGameSortDirection = {
  Ascending: 0,
  Descending: 1,
};

export interface SIGameParsed {
  description: string;
  name: string;
  rounds: SIGameRound[];
  stats: {
    rounds: number;
    themes: number;
    questions: number;
  };
}

export interface SIGameRound {
  name: string;
  themes: SIGameTheme[];
}

export interface SIGameTheme {
  name: string;
  questions: SIGameQuestion[];
}

export interface SIGameQuestion {
  scenario: {
    text: string;
    embed?: string;
  };
  right: {
    answer: string;
  };
  price: number;
}
