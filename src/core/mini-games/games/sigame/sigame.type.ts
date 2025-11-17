export interface SIGamePackInfo {
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
