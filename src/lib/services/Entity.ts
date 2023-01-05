import { API, Query } from './directus';

export class DirectusEntity {
  $exist = false;

  id: any;

  protected static get collection() {
    return this.prototype.constructor.name;
  }

  static async findOne<T extends DirectusEntity>(
    this: new () => T,
    id: string,
    query?: Query,
  ): Promise<T | null> {
    const self = this as any;
    try {
      let data = await API.request({
        method: 'GET',
        url: `items/${self.collection}/${id}`,
        query: typeof query == 'object' ? query : undefined,
      });
      if (data instanceof Array) {
        data = data.at(0);
      }
      if (data) {
        return self.create({ ...data, $exist: true });
      }
    } catch (e) {}
    return null;
  }

  static async find<T extends DirectusEntity>(
    this: new () => T,
    all = false,
    query: Query = {},
  ): Promise<T[]> {
    const self = this as any;
    const data = await API.request({
      method: 'GET',
      url: `items/${self.collection}`,
      query: {
        ...query,
        limit: all ? -1 : undefined,
      },
    });
    if (data) {
      return data.map((item: any) => self.create({ ...item, $exist: true }));
    }
    return null;
  }

  static create<T extends DirectusEntity>(
    this: new (...args: any[]) => T,
    props: Partial<T>,
  ) {
    const instance = new this();

    for (const [key, value] of Object.entries(props)) {
      instance[key as keyof T] = value;
    }

    return instance;
  }

  async save() {
    const self = this.constructor as any;
    const isExist = this.$exist && this.id;
    const data = await API.request({
      method: isExist ? 'PATCH' : 'POST',
      url: `items/${self.collection}/${isExist ? this.id : ''}`,
      body: this.getSaveFields(),
    });
    return data != null;
  }

  async delete() {
    const self = this.constructor as any;
    const data = await API.request({
      method: 'DELETE',
      url: `items/${self.collection}/${this.$exist ? this.id : ''}`,
    });
    return data != null;
  }

  private getSaveFields() {
    const fields = Object.getOwnPropertyNames(this).filter(
      (property) => !property.startsWith('$'),
    );

    const data: Record<string, any> = {};

    fields.forEach((field) => {
      data[field] = this[field as keyof DirectusEntity];
    });

    return data;
  }
}
