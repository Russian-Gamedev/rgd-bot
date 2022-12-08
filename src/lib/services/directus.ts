import { Directus } from '@directus/sdk';
import { container } from '@sapphire/pieces';
import { TEMPLATES } from '../../configs/templates';
import { Collections, CollectionsType, User } from './directus.type';

export class API {
  private client = new Directus<CollectionsType>('https://cms.rgd.chat/');

  constructor() {
    this.ready().catch((e) => container.logger.error(e.errors));
  }

  async ready() {
    await this.client.auth.static(process.env.DIRECTUS_TOKEN);
    container.logger.info('API ready');

    this.updateTemplates();
  }

  async updateTemplates() {
    const { data } = await this.client
      .items(Collections.BotEvents)
      .readByQuery();

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
    return this.client.items(Collections.User).readOne(id);
  }

  createUser(props: Partial<User>) {
    const defaultProps = {
      about: null,
      birthData: null,
      coins: 0,
      firstJoin: new Date().toISOString(),
      leaveCount: 0,
      reputation: 0,
      voiceTime: 0,
      ...props,
    } as User;
    return this.client.items(Collections.User).createOne(defaultProps);
  }

  updateUser(props: Partial<User>) {
    return this.client.items(Collections.User).updateOne(props.id, props);
  }
}
