import { Injectable, Logger } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import fs from 'fs/promises';
import JSZip from 'jszip';
import path from 'path';

import { FFMpegService } from '#core/ffmpeg/ffmpeg.service';

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

  constructor(private readonly ffmpeg: FFMpegService) {
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
        await this.unzipPack(packPathZip);
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
    const fileMap: Record<string, string> = await Bun.file(
      path.join(packDir, 'filemap.json'),
    ).json();
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
      let themes = round.themes.theme;
      if (!Array.isArray(themes)) {
        themes = [themes];
      }
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
          let price = Number(question['@_price']);

          if (price != price || price <= 0) {
            price = 100;
          }

          price = Math.min(Math.max(price, 100), 100_000);

          const atoms: (string | { '@_type'?: string; '#text': string })[] = [];
          if ('scenario' in question) {
            if (Array.isArray(question.scenario.atom)) {
              atoms.push(...question.scenario.atom);
            } else {
              atoms.push(question.scenario.atom);
            }
          }
          if ('params' in question) {
            const param = question.params.param;
            const params = Array.isArray(param) ? param : [param];
            for (const param of params) {
              if ('item' in param) {
                atoms.push({
                  '@_type': param.item['@_type'],
                  '#text': param.item['#text'],
                });
              }
            }
          }
          let text = '';
          let embed: string | undefined;

          for (const atom of atoms) {
            if (typeof atom === 'string') {
              text = atom;
            } else if ('@_type' in atom) {
              if (atom['@_type']) {
                if (atom['@_type'] === 'marker') {
                  continue;
                }
                embed = this.resolveAsset(
                  packId,
                  atom['#text'],
                  atom['@_type'],
                  fileMap,
                );
              } else {
                text = atom['#text'];
              }
            }
          }

          const answer = String(question.right.answer);
          if (!answer) continue;
          if (!text && !embed) continue;

          const parsedQuestion: SIGameQuestion = {
            price,
            right: {
              answer,
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

  private resolveAsset(
    packId: number,
    asset: string,
    type: string,
    fileMap: Record<string, string>,
  ) {
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

    if (fileMap[asset]) {
      asset = fileMap[asset];
    } else {
      this.logger.warn(
        `Asset ${asset} not found in file map for pack ${packId}`,
      );
    }

    return path.join(packDir, assetDir, asset);
  }

  private async unzipPack(pathToZip: string) {
    this.logger.log(`Extracting pack: ${pathToZip}`);
    const zip = new JSZip();
    const data = await Bun.file(pathToZip).arrayBuffer();
    const contents = await zip.loadAsync(data);

    let fileId = 0;
    const ignoreFiles = ['content.xml'];
    const queueToCompress: string[] = [];
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

    const mapFiles = new Map<string, string>();
    const packsDir = path.resolve('temp/packs');

    for (const [filePath, file] of Object.entries(contents.files)) {
      const ext = path.extname(filePath);
      const filename = path.basename(filePath, ext);
      let normalizedFileName = filePath;
      if (!ignoreFiles.includes(filename + ext)) {
        const newFileName = String(++fileId);
        normalizedFileName = filePath.replace(filename, newFileName);
        mapFiles.set(decodeURIComponent(filename) + ext, newFileName + ext);
      }

      const fullPath = path.join(
        packsDir,
        path.basename(pathToZip, '.zip'),
        normalizedFileName,
      );
      if (file.dir) {
        await fs.mkdir(fullPath, { recursive: true });
      } else {
        const content = await file.async('nodebuffer');
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content);
        const stat = await fs.stat(fullPath);
        if (stat.size > MAX_FILE_SIZE) {
          queueToCompress.push(fullPath);
        }
      }
    }
    await Bun.write(
      path.join(packsDir, path.basename(pathToZip, '.zip'), 'filemap.json'),
      JSON.stringify(Object.fromEntries(mapFiles), null, 2),
    );

    this.logger.log(`Compressing large files (${queueToCompress.length})...`);
    for (const filePath of queueToCompress) {
      const ext = path.extname(filePath);
      const newFile = filePath.replace(ext, `.min${ext}`);
      this.logger.log(`Compressing file: ${filePath}`);
      await this.ffmpeg.compressFile(filePath, newFile, 10);
      await fs.unlink(filePath);
      await fs.rename(newFile, filePath);
      this.logger.log(`Compressed and replaced: ${filePath}`);
    }

    this.logger.log(`Extraction complete: ${pathToZip}`);
    await fs.unlink(pathToZip);
    return true;
  }
}
