import { Injectable, Logger } from '@nestjs/common';
import { $ } from 'bun';
import { XMLParser } from 'fast-xml-parser';
import fs from 'fs/promises';
import path from 'path';

import {
  SIGamePack,
  SIGameParsed,
  SIGameQuestion,
  SIGameRound,
  SIGameSortDirection,
  SIGameSortMode,
  SIGameTag,
  SIGameTheme,
} from './sigame.type';

@Injectable()
export class SIGameService {
  private readonly logger = new Logger(SIGameService.name);

  private cachedTags: SIGameTag[] = [];

  constructor() {
    ///
  }

  async searchPacks(query?: string, tag?: string) {
    ///
    const url = new URL(
      'https://www.sibrowser.ru/sistorage//api/v1/packages/search',
    );
    url.searchParams.set('difficulty', '1');
    url.searchParams.set('difficultyCompareMode', '3');
    url.searchParams.set('sortMode', SIGameSortMode.DatePublished.toString());
    url.searchParams.set(
      'sortDirection',
      SIGameSortDirection.Ascending.toString(),
    );
    url.searchParams.set('from', '0');
    url.searchParams.set('count', '10');
    if (query) {
      url.searchParams.set('searchText', query);
    }
    if (tag) {
      url.searchParams.set('tag', tag);
    }
    const response: { packages: SIGamePack[]; total: number } = await fetch(
      url,
    ).then((res) => res.json());

    return response;
  }

  async getPackById(packId: number) {
    const url = new URL(
      `https://www.sibrowser.ru/sistorage//api/v1/packages/${packId}`,
    );
    const pack: SIGamePack = await fetch(url).then((res) => res.json());
    return pack;
  }

  async getPackTags() {
    if (this.cachedTags.length > 0) {
      return this.cachedTags;
    }
    const tags = await fetch(
      'https://www.sibrowser.ru/sistorage//api/v1/facets/tags',
    ).then((res) => res.json());

    this.cachedTags = tags;
    return tags as SIGameTag[];
  }

  async downloadPack(pack: SIGamePack) {
    /// check if file exists
    const packsDir = path.resolve('temp/packs');
    await fs.mkdir(packsDir, { recursive: true });
    const packPath = path.join(packsDir, `${pack.id}`);
    const packPathZip = packPath + '.zip';
    if (await fs.stat(packPath).catch(() => false)) {
      this.logger.log(`Pack already downloaded: ${packPath}`);
    } else {
      try {
        this.logger.log(`Downloading pack to: ${packPath}`);
        const response = await fetch(pack.directContentUri);
        const buffer = await response.arrayBuffer();
        await Bun.write(packPathZip, Buffer.from(buffer));
        await $`echo 'n' | unzip -o ${packPathZip} -d ${path.join(packsDir, pack.id.toString())}`;
        await fs.rm(packPathZip);
      } catch (error) {
        this.logger.error(
          `Failed to download or extract pack ${pack.id}: ${error}`,
        );
        await fs.rmdir(packPath).catch(() => null);
        throw error;
      }
    }
    return true;
  }

  async parsePack(packId: number) {
    const packsDir = path.resolve('temp/packs');
    const packDir = path.join(packsDir, `${packId}`);
    const contentXML = await Bun.file(packDir + '/content.xml').text();
    const content = new XMLParser({ ignoreAttributes: false }).parse(
      contentXML,
    );
    const name = content.package['@_name'] ?? 'Unnamed Pack';
    const description = content.package.info.comments ?? 'No description';
    await Bun.write(
      path.join(packDir, 'content.json'),
      JSON.stringify(content, null, 2),
    );
    const rounds = content.package.rounds.round;

    const parsedGame: SIGameParsed = {
      description,
      name,
      rounds: [],
      stats: {
        questions: 0,
        themes: 0,
        rounds: 0,
      },
    };

    for (const round of rounds) {
      const themes = round.themes.theme;
      const roundName =
        round['@_name'] ?? `${rounds.indexOf(round) + 1}-й раунд`;
      const parsedRound: SIGameRound = {
        themes: [],
        name: roundName,
      };
      parsedGame.rounds.push(parsedRound);
      parsedGame.stats.rounds += 1;
      for (const theme of themes) {
        const themeName =
          theme['@_name'] ?? `Тема ${themes.indexOf(theme) + 1}`;

        const parsedTheme: SIGameTheme = {
          name: themeName,
          questions: [],
        };
        parsedRound.themes.push(parsedTheme);
        parsedGame.stats.themes += 1;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let questions: any;
        if (Array.isArray(theme.questions.question)) {
          questions = theme.questions.question;
        } else {
          questions = [theme.questions.question];
        }

        for (const question of questions) {
          const price = Number(question['@_price'] ?? 100) / 100;

          const atom = question.scenario.atom;
          const atoms = Array.isArray(atom) ? atom : [atom];
          let text = '';
          let embed: string | undefined;

          for (const atom of atoms) {
            if (typeof atom === 'string') {
              text = atom;
            } else if ('@_type' in atom) {
              if (atom['@_type']) {
                embed = this.resolveAsset(
                  packId,
                  atom['#text'],
                  atom['@_type'],
                );
              } else {
                text = atom['#text'];
              }
            }
          }

          if (!text && !embed) continue;

          const parsedQuestion: SIGameQuestion = {
            price,
            right: {
              answer: question.right.answer,
            },
            scenario: {
              embed,
              text: text,
            },
          };
          parsedTheme.questions.push(parsedQuestion);
          parsedGame.stats.questions += 1;
        }
      }
    }

    await Bun.write(
      path.join(packDir, 'parsed.json'),
      JSON.stringify(parsedGame, null, 2),
    );

    return parsedGame;
  }

  async deletePack(packId: number) {
    const packsDir = path.resolve('temp/packs');
    const packDir = path.join(packsDir, `${packId}`);
    await fs.rm(packDir, { recursive: true, force: true });
    this.logger.log(`Deleted pack ${packId} from disk.`);
    return true;
  }

  private resolveAsset(packId: number, asset: string, type: string) {
    if (asset.startsWith('@')) {
      asset = asset.slice(1);
    }

    const packsDir = path.resolve('temp/packs');
    const assetDir =
      type === 'image'
        ? 'Images'
        : type === 'audio' || type === 'voice'
          ? 'Audio'
          : 'Video';
    const packDir = path.join(packsDir, `${packId}`);

    /// if contain non ascii characters, encode
    if (/[^a-zA-Z0-9/_\-.]/.test(asset)) {
      asset = encodeURIComponent(asset);
    }

    return path.join(packDir, assetDir, asset);
  }
}
