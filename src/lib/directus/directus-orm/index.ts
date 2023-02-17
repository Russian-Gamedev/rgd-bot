import { FilterRule } from './filters';
import type { RequestConfig } from './types';

export class DirectusApi {
  private readonly baseUrl = 'https://cms.rgd.chat/';
  private token: string;

  static instance = new DirectusApi();

  async login(token: string) {
    this.token = token;

    const response = await this.request({
      url: 'users/me',
      method: 'GET',
    });

    if (response) {
      return response;
    }
    throw new Error('Directus not authorized');
  }

  async request(config: RequestConfig) {
    let url = this.baseUrl + config.url;
    const requestInit: RequestInit = {
      method: config.method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Accept-Encoding': 'gzip,deflate,compress',
      },
    };

    if (config.query) {
      const search = new URLSearchParams();
      for (const [key, value] of Object.entries(config.query)) {
        if (value instanceof FilterRule) {
          search.set(key, JSON.stringify(value.build()));
        } else {
          search.set(key, value.toString());
        }
      }
      url += '?' + search.toString();
    }

    if (['POST', 'PATCH'].includes(config.method)) {
      requestInit.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, requestInit);
      let body = await response.json();

      /// Directus non-singleton objects return in {data: T} formats
      if ('data' in body) {
        body = body.data;
      }

      if ('errors' in body) {
        throw new Error('Directus API Error', { cause: body.errors });
      }

      return body;
    } catch (e) {
      console.error(e);
    }
    return null;
  }
}
