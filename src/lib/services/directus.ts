import { DiscordEvents } from './entities/Events';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { container } from '@sapphire/pieces';
import { TEMPLATES } from '../../configs/templates';

export class API {
  private static readonly baseUrl = 'https://cms.rgd.chat/';
  private static token: string;

  constructor() {
    API.token = process.env.DIRECTUS_TOKEN;
    this.ready().catch((e) => container.logger.error(e.errors));
  }

  async ready() {
    container.logger.info('API ready');

    this.updateTemplates();
  }

  async updateTemplates() {
    const data = await DiscordEvents.find(true);
    Object.assign(TEMPLATES, {});

    data.forEach((event) => {
      if (!(event.type in TEMPLATES)) {
        TEMPLATES[event.type] = [];
      }

      TEMPLATES[event.type].push({
        message: event.message,
        attachment: event.attachment,
      });
    });

    container.logger.info(`Updated ${data.length} bot events`);
  }

  static async request(config: RequestConfig) {
    const axiosConfig: AxiosRequestConfig = {
      method: config.method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Accept-Encoding': 'gzip,deflate,compress',
      },
      url: this.baseUrl + config.url,
    };

    if (config.query && config.method === 'GET') {
      axiosConfig.url += '?' + this.queryBuilder(config.query);
    }
    if (
      config.body &&
      (config.method === 'POST' || config.method === 'PATCH')
    ) {
      axiosConfig.data = config.body;
    }

    try {
      let { data } = await axios(axiosConfig);
      if ('data' in data) {
        data = data.data;
      }
      return data;
    } catch (e) {
      if (e instanceof AxiosError) {
        container.logger.error(
          e.response.data.errors[0].message,
          `${config.method}: ${config.url}`,
        );
      }
      return null;
    }
  }

  private static queryBuilder(query: Record<string, any>) {
    return Object.entries(query)
      .filter(([_, value]) => value != undefined)
      .map(
        ([key, value]) =>
          `${key}=${encodeURIComponent(
            typeof value === 'object' ? JSON.stringify(value) : value,
          )}`,
      )
      .join('&');
  }
}

type RequestConfig = {
  url: string;
  method: 'GET' | 'POST' | 'PATCH' | 'SEARCH' | 'DELETE';
  body?: Record<string, any>;
  query?: Query;
};

export type Query = {
  fields?: string;
  filter?: Record<string, any>;
  search?: string;
  sort?: string;
  limit?: number;
  offset?: number;
  page?: number;
};
