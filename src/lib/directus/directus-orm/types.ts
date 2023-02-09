import type { FilterRule } from './filters';

export type RequestConfig = {
  url: string;
  method: 'GET' | 'POST' | 'PATCH' | 'SEARCH' | 'DELETE';
  body?: Record<string, unknown>;
  query?: Partial<DirectusQuery>;
};

export type DateTimeFunctions =
  | 'year'
  | 'month'
  | 'week'
  | 'day'
  | 'weekday'
  | 'hour'
  | 'minute'
  | 'second';

export type DirectusQuery = {
  fields: string;
  search: string;
  filter: FilterRule;
  sort: string;
  limit: number;
  offset: number;
  page: number;
};
