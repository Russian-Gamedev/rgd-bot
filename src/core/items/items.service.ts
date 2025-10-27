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

  getUserItems(user_id: DiscordID): Promise<ItemEntity[]> {
    return this.itemRepository.find({ user_id });
  }

  getItemById(id: number): Promise<ItemEntity | null> {
    return this.itemRepository.findOne({ id });
  }

  async createItem(item: Partial<ItemEntity>): Promise<ItemEntity> {
    const newItem = new ItemEntity();
    Object.assign(newItem, item);
    await this.entityManager.persistAndFlush(newItem);
    return newItem;
  }

  async transferItem(
    item: ItemEntity,
    targetUserID: DiscordID,
  ): Promise<ItemEntity> {
    item.transferHistory.push({
      from: item.user_id,
      to: targetUserID,
      date: new Date(),
    });
    item.user_id = targetUserID;
    await this.entityManager.persistAndFlush(item);
    return item;
  }

  async getItems() {
    return this.itemRepository.findAll();
  }
}
