import { EntityManager } from '@mikro-orm/core';
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

  async getRoleByEmoji(channel_id: string, message_id: string, emoji: string) {
    return this.database.findOne(RoleReactionEntity, {
      channel_id,
      message_id,
      emoji,
    });
  }

  async getEmojiWeight(emoji: string) {
    const entity = await this.database.findOne(ReactionWeightEntity, { emoji });

    return entity?.weight || 1;
  }
}
