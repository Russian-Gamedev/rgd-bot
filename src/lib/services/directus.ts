import { Directus } from '@directus/sdk';
import { container } from '@sapphire/framework';
import { TEMPLATES } from '../../configs/templates';
import type { Collections } from './directus.type';

export class API {
  private client = new Directus<Collections>('https://cms.rgd.chat/', {
    auth: {
      staticToken: process.env.DIRECTUS_TOKEN,
    },
  });

  constructor() {
    this.ready().catch((e) => container.logger.error(e.errors));
  }

  async ready() {
    container.logger.info('API ready');

    this.updateTemplates();
  }

  async updateTemplates() {
    const { data } = await this.client.items('Bot_Events').readByQuery();

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

  async getUser(id: string) {
    return this.client.items('Users').readOne(id);
  }
}
