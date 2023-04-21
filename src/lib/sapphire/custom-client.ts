import { SapphireClient, type StoreRegistryEntries } from '@sapphire/framework';
import type { ClientOptions } from 'discord.js';
import { getRootData } from '@sapphire/pieces';
import path from 'path';
import fs from 'fs';

const FoldersToStore: Record<string, keyof StoreRegistryEntries> = {
  interactions: 'interaction-handlers',
  commands: 'commands',
  listeners: 'listeners',
  arguments: 'arguments',
  preconditions: 'preconditions',
};

export class CustomClient extends SapphireClient {
  private rootData = getRootData();

  public constructor(options: ClientOptions) {
    super(options);
    //Store.logger = (value) => console.log(value);
    this.registerModules();
  }

  private registerModules() {
    const modules_root = path.join(this.rootData.root, 'src/modules');
    const modules_folders = fs.readdirSync(modules_root);

    for (const module of modules_folders) {
      const module_folder = path.join(modules_root, module);
      if (!fs.statSync(module_folder).isDirectory()) continue;
      this.registerModule(module_folder);
      //this.logger.info(`[MODULE] ${module} loaded`);
    }
  }

  private registerModule(module_path: string) {
    const folders = fs.readdirSync(module_path);
    for (const folder of folders) {
      const folderPath = path.join(module_path, folder);

      if (!fs.statSync(folderPath).isDirectory()) continue;
      if (!(folder in FoldersToStore)) continue;

      const key = FoldersToStore[folder];
      this.stores.get(key).registerPath(folderPath);
    }
  }
}
