import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';

import { type DiscordID } from '#root/lib/types';

import { ItemEntity } from './entities/item.entity';

@Injectable()
export class ItemsService {
  constructor(
    @InjectRepository(ItemEntity)
    private readonly itemRepository: EntityRepository<ItemEntity>,
    private readonly entityManager: EntityManager,
  ) {}

  getItems(guild_id: DiscordID, user_id: DiscordID): Promise<ItemEntity[]> {
    return this.itemRepository.find({ guild_id, user_id });
  }

  async createItem(item: Partial<ItemEntity>): Promise<ItemEntity> {
    const newItem = new ItemEntity();
    Object.assign(newItem, item);
    await this.entityManager.persistAndFlush(newItem);
    return newItem;
  }
}
