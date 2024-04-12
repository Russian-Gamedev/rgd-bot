import { EntityManager } from '@mikro-orm/postgresql';
import { container } from '@sapphire/pieces';

import { BotEventsEntity } from '#base/entities/events.entity';
import { BotEvents } from '#config/constants';
import { pickRandom } from '#lib/utils';

export class BotEventsService {
  private static _instance: BotEventsService;

  static get Instance() {
    if (!this._instance) {
      const orm = container.orm.em.fork();
      this._instance = new BotEventsService(orm);
    }
    return this._instance;
  }

  constructor(readonly database: EntityManager) {}

  async getRandom(
    guild_id: string,
    type: BotEvents,
    params: Record<string, string>,
  ) {
    /// Получаем список, которые меньше максимального в таблице ИЛИ все равны

    const queryMax =
      '("event"."triggered_count" < (SELECT MAX("triggered_count") FROM "bot_events" WHERE "type" = ? ))';

    const queryDistinct =
      '(SELECT COUNT(DISTINCT triggered_count) FROM bot_events WHERE "type" = ?) = 1';

    const events = await this.database
      .createQueryBuilder(BotEventsEntity)
      .select('*')
      .where({ type, guild_id })
      .andWhere(`${queryMax} or ${queryDistinct}`, [type, type])
      .orderBy({ triggered_count: 'ASC' })
      .execute();

    const names = Object.keys(params);
    const values = Object.values(params);
    const template = this.database.map(BotEventsEntity, pickRandom(events));

    template.triggered_count++;

    await this.database.persistAndFlush(template);

    let message: string = new Function(
      ...names,
      `return \`${template.message}\`;`,
    )(...values);

    const attachments = template.attachment?.split(',') ?? [];

    if (attachments.length) {
      message += '\n' + pickRandom(attachments).trim();
    }

    return message;
  }

  async addEvent(
    guild_id: string,
    type: BotEvents,
    message: string,
    attachment: string | null = null,
  ) {
    const event = this.database.create(BotEventsEntity, {
      type,
      message,
      attachment,
      guild_id,
    });
    await this.database.persistAndFlush(event);
  }
}
