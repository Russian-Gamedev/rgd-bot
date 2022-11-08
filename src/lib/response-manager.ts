import path from 'path';
import fs from 'fs';

import { container } from '@sapphire/framework';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
/// @ts-ignore
import type JsonDictionaryType from '../../response-dictionary.json';

type ResponseDictionary = typeof JsonDictionaryType;

const pathDictionary = path.resolve('response-dictionary.json');

export class ResponseManager {
  private data: ResponseDictionary;

  constructor() {
    this.load();
  }

  get<
    T extends keyof ResponseDictionary,
    K extends keyof ResponseDictionary[T],
  >(type: T, key: K, random = true) {
    const response = this.data[type][key];

    if (random && response instanceof Array) {
      return response[Math.floor(Math.random() * response.length)];
    }

    return response;
  }

  private load() {
    const fileData = fs.readFileSync(pathDictionary, 'utf-8');
    this.data = JSON.parse(fileData);
    container.logger.info('Response-Dictionary loaded');
  }
}
