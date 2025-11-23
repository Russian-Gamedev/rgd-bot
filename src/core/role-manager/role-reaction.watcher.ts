import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Injectable } from '@nestjs/common';
import { Context, type ContextOf, On } from 'necord';

import { RoleReactionEntity } from './entities/role-reaction.entity';

@Injectable()
export class RoleReactionWatcher {
  constructor(
    @InjectRepository(RoleReactionEntity)
    private readonly roleReactionRepository: EntityRepository<RoleReactionEntity>,
  ) {}

  @On('messageReactionAdd')
  async handleReactionAdded(
    @Context() [reaction, user]: ContextOf<'messageReactionAdd'>,
  ) {
    if (user.bot) return;

    const member = await reaction.message.guild?.members.fetch(user.id);
    const emoji = reaction.emoji.id ?? reaction.emoji.name;
    if (!emoji) return;

    const roleReaction = await this.roleReactionRepository.findOne({
      message_id: reaction.message.id,
      emoji,
    });

    if (!roleReaction) return;

    if (member && reaction.message.guild) {
      await member.roles.add(roleReaction.role_id.toString());
    }
  }

  @On('messageReactionRemove')
  async handleReactionRemoved(
    @Context() [reaction, user]: ContextOf<'messageReactionRemove'>,
  ) {
    if (user.bot) return;

    const member = await reaction.message.guild?.members.fetch(user.id);
    const emoji = reaction.emoji.id ?? reaction.emoji.name;
    if (!emoji) return;

    const roleReaction = await this.roleReactionRepository.findOne({
      message_id: reaction.message.id,
      emoji,
    });

    if (!roleReaction) return;

    if (member && reaction.message.guild) {
      await member.roles.remove(roleReaction.role_id.toString());
    }
  }
}
