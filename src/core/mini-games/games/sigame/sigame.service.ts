import { Injectable, Logger } from '@nestjs/common';
import fs from 'fs/promises';
import JSZip from 'jszip';
import path from 'path';

import { FFMpegService } from '#core/ffmpeg/ffmpeg.service';
import { hashStringToInt } from '#root/lib/utils';

import { SIGameParserFactory } from './engine/parsers';
import { SIGameParserSIQ } from './engine/parsers/siq';
import { SIGameParseYGPackage3 } from './engine/parsers/ygpackage3';
import {
  SIGamePackInfo,
  SIGameSortDirection,
  SIGameSortMode,
  SIGameTag,
} from './sigame.type';

@Injectable()
export class SIGameService {
  private readonly logger = new Logger(SIGameService.name);

  private cachedTags: SIGameTag[] = [];

  private parserFactory = new SIGameParserFactory([
    new SIGameParseYGPackage3(),
    new SIGameParserSIQ(),
  ]);

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
    const response: { packages: SIGamePackInfo[]; total: number } = await fetch(
      url,
    ).then((res) => res.json());

    return response;
  }

  async getPackById(packId: number) {
    const url = new URL(
      `https://www.sibrowser.ru/sistorage//api/v1/packages/${packId}`,
    );
    const pack: SIGamePackInfo = await fetch(url).then((res) => res.json());
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

  async downloadPack(uri: string) {
    const id = hashStringToInt(uri);
    /// check if file exists
    const packsDir = path.resolve('temp/packs');
    await fs.mkdir(packsDir, { recursive: true });
    const packPath = path.join(packsDir, `${id}`);
    const packPathZip = packPath + '.zip';
    if (await fs.stat(packPath).catch(() => false)) {
      this.logger.log(`Pack already downloaded: ${packPath}`);
    } else {
      try {
        this.logger.log(`Downloading pack to: ${packPath}`);
        const response = await fetch(uri);
        const buffer = await response.arrayBuffer();
        await Bun.write(packPathZip, Buffer.from(buffer));
        await this.unzipPack(packPathZip);
      } catch (error) {
        this.logger.error(`Failed to download or extract pack ${id}: ${error}`);
        await fs.rmdir(packPath).catch(() => null);
        throw error;
      }
    }
    return true;
  }

  async checkPackExists(packId: number): Promise<boolean> {
    const packsDir = path.resolve('temp/packs');
    const packPath = path.join(packsDir, `${packId}`);
    const exists = await fs.stat(packPath).catch(() => false);
    return !!exists;
  }

  async parsePack(packId: number) {
    const packsDir = path.resolve('temp/packs');
    const packDir = path.join(packsDir, `${packId}`);
    const fileMap: Record<string, string> = await Bun.file(
      path.join(packDir, 'filemap.json'),
    ).json();
    const contentXML = await Bun.file(packDir + '/content.xml').text();

    const parser = this.parserFactory.getParser(contentXML);
    if (!parser) {
      this.logger.warn(`No parser found for pack ${packId}`);
      return;
    }

    this.logger.debug(
      `Using parser ${parser.constructor.name} for pack ${packId}`,
    );
    const pack = await parser.parse(contentXML);
    pack.setFileMap(fileMap);

    await Bun.write(
      path.join(packDir, 'temp/parsed.json'),
      JSON.stringify(pack, null, 2),
    );

    return pack;
  }

  async deletePack(packId: number) {
    const packsDir = path.resolve('temp/packs');
    const packDir = path.join(packsDir, `${packId}`);
    await fs.rm(packDir, { recursive: true, force: true });
    this.logger.log(`Deleted pack ${packId} from disk.`);
    return true;
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
        normalizedFileName = String(++fileId) + ext;
      }

      const fullPath = path.join(
        packsDir,
        path.basename(pathToZip, '.zip'),
        normalizedFileName,
      );

      mapFiles.set(decodeURIComponent(filename) + ext, fullPath);

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
