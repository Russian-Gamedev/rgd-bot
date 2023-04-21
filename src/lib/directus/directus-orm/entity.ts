import type { DirectusQuery } from './types';
import { container } from '@sapphire/pieces';
import { DirectusApi } from '@/lib/directus/directus-orm/index';

export class DirectusEntity {
  $exist = false;

  id: unknown;

  static get collection() {
    return this.prototype.constructor.name;
  }

  static create<T extends DirectusEntity>(
    this: new () => T,
    fields: Partial<T>,
  ) {
    const instance = new this();
    for (const [key, value] of Object.entries(fields)) {
      instance[key as keyof T] = value;
    }
    return instance;
  }

  static async find<T extends DirectusEntity>(
    this: new () => T,
    query: Partial<DirectusQuery>,
  ): Promise<T[]> {
    const self = this as unknown as typeof DirectusEntity;
    const response = await DirectusApi.instance.request({
      method: 'GET',
      url: `items/${self.collection}`,
      query,
    });

    if (response) {
      return response.map((item: T) => self.create({ ...item, $exist: true }));
    }
    return null;
  }

  static async findOne<T extends DirectusEntity>(
    this: new () => T,
    id: string,
    query?: Partial<DirectusQuery>,
  ): Promise<T | null> {
    const self = this as unknown as typeof DirectusEntity;
    try {
      let response = await DirectusApi.instance.request({
        method: 'GET',
        url: `items/${self.collection}/${id}`,
        query,
      });
      if (response instanceof Array) {
        response = response.at(0);
      }

      if (!response) return null;

      return self.create({ ...response, $exist: true }) as T;
    } catch (e) {
      return null;
    }
  }

  async save() {
    const self = this.constructor as typeof DirectusEntity;

    const isExist = this.$exist && this.id;

    const response = await DirectusApi.instance.request({
      method: isExist ? 'PATCH' : 'POST',
      url: `items/${self.collection}/${isExist ? this.id : ''}`,
      body: this.getFields(),
    });

    return response != null;
  }

  async delete() {
    const self = <typeof DirectusEntity>this.constructor;
    const response = await DirectusApi.instance.request({
      method: 'DELETE',
      url: `items/${self.collection}/${this.id}`,
    });
    return response != null;
  }

  private getFields() {
    const fields = Object.getOwnPropertyNames(this).filter(
      (property) => !property.startsWith('$'),
    );

    const data: Record<string, unknown> = {};

    for (const field of fields) {
      data[field] = this[field as keyof DirectusEntity];
    }

    return data;
  }
}
