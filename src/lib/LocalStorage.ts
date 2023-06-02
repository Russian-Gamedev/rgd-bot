import fs from 'fs';
import path from 'path';

const STORAGE_FILE = path.resolve('.local-storage.json');

export class LocalStorage {
  private static data: Record<string, unknown> = {};

  static setItem(key: string, value: unknown) {
    this.data[key] = value;
    this.save();
  }
  static getItem<T>(key: string) {
    return this.data[key] as T;
  }

  static save() {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(this.data, null, 2));
  }
  static load() {
    if (fs.existsSync(STORAGE_FILE)) {
      const json = fs.readFileSync(STORAGE_FILE, 'utf-8');
      if (json) {
        this.data = JSON.parse(json);
      }
    }
  }
}

LocalStorage.load();
