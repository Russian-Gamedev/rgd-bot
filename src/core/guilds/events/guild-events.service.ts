import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { Client } from 'discord.js';

import { GuildEvents } from '#config/guilds';
import { pickRandom } from '#root/lib/utils';

import { GuildEventEntity } from './entities/events.entity';

@Injectable()
export class GuildEventService {
  constructor(
    @InjectRepository(GuildEventEntity)
    private readonly guildEventRepository: EntityRepository<GuildEventEntity>,
    private readonly entityManager: EntityManager,
    private readonly discord: Client,
  ) {}

  async getRandom(
    guild_id: bigint | number | string,
    event: GuildEvents,
    params: Record<string, string> = {},
  ) {
    /// Получаем список, которые меньше максимального в таблице ИЛИ все равны

    const queryMax =
      '("events"."triggered_count" < (SELECT MAX("triggered_count") FROM "guild_events" WHERE "event" = ? AND "guild_id" = ? ))';
    const queryDistinct =
      '(SELECT COUNT(DISTINCT triggered_count) FROM guild_events WHERE "event" = ? AND "guild_id" = ?) = 1';

    const events = await this.guildEventRepository
      .createQueryBuilder('events')
      .select('*')
      .where({ event })
      .andWhere(`${queryMax} OR ${queryDistinct}`, [
        event,
        guild_id,
        event,
        guild_id,
      ])
      .orderBy({ triggered_count: 'ASC' })
      .execute();

    if (!events.length) return null;
    const template = this.guildEventRepository.map(pickRandom(events));
    if (!template) return null;

    template.triggered_count++;

    await this.entityManager.persistAndFlush(template);

    const names = Object.keys(params);
    const values = Object.values(params);

    let message = template.message.replace(/\$\{(\w+)\}/g, (match, p1) => {
      const index = names.indexOf(p1);
      return index !== -1 ? values[index] : match;
    });

    const attachment = pickRandom(template.attachments ?? []);
    if (attachment) {
      message += `\n${attachment}`;
    }

    return message;
  }

  async addEvent(
    guild_id: bigint,
    event: GuildEvents,
    message: string,
    attachments: string[] | null,
  ) {
    const newEvent = new GuildEventEntity();
    newEvent.guild_id = guild_id;
    newEvent.event = event;
    newEvent.message = message;
    newEvent.attachments = attachments;

    await this.entityManager.persistAndFlush(newEvent);
    return newEvent;
  }

  async removeEvent(guild_id: bigint, event_id: string) {
    const event = await this.guildEventRepository.findOne({
      id: event_id,
      guild_id,
    });
    if (!event) return false;

    await this.entityManager.removeAndFlush(event);
    return true;
  }

  async listEvents(guild_id: bigint, event: GuildEvents) {
    return this.guildEventRepository.find(
      { guild_id, event },
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  async listAllEvents(guild_id: bigint) {
    return this.guildEventRepository.find(
      { guild_id },
      { orderBy: { createdAt: 'DESC' } },
    );
  }
}
