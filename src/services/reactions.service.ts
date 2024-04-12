import { EntityManager, FilterQuery } from '@mikro-orm/core';
import { container } from '@sapphire/pieces';

import { ReactionWeightEntity } from '#base/entities/reaction-weight.entity';
import { RoleReactionEntity } from '#base/entities/role-reaction.entity';

export class ReactionsService {
  private static instance: ReactionsService;

  static get Instance() {
    if (!this.instance) {
      const orm = container.orm.em.fork();
      this.instance = new ReactionsService(orm);
    }
    return this.instance;
  }

  constructor(readonly database: EntityManager) {}

  async getRole(filter: FilterQuery<RoleReactionEntity>) {
    return this.database.findOne(RoleReactionEntity, filter);
  }

  async getEmojiWeight(guild_id: string, emoji: string) {
    const entity = await this.database.findOne(ReactionWeightEntity, {
      emoji,
      guild_id,
    });

    return entity?.weight || 1;
  }

  async deleteRolesReaction(
    guild_id: string,
    channel_id: string,
    message_id: string,
  ) {
    return this.database.nativeDelete(RoleReactionEntity, {
      channel_id,
      message_id,
      guild_id,
    });
  }

  async addRolesReaction(
    guild_id: string,
    channel_id: string,
    message_id: string,
    roles: [string, string][],
  ) {
    for (const [role_id, emoji] of roles) {
      const entity = this.database.create(RoleReactionEntity, {
        guild_id,
        channel_id,
        message_id,
        role_id,
        emoji,
      });
      this.database.persist(entity);
    }
    await this.database.flush();
  }
}
