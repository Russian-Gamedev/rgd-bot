import { EntityManager } from '@mikro-orm/postgresql';
import { container } from '@sapphire/pieces';
import { Guild } from 'discord.js';

import { InviteEntity } from '#base/entities/invite.entity';

export class InviteService {
  private static _instance: InviteService;

  static get Instance() {
    if (!this._instance) {
      const orm = container.orm.em.fork();
      this._instance = new InviteService(orm);
    }
    return this._instance;
  }

  constructor(readonly database: EntityManager) {}

  async updateGuildInvites(guild: Guild) {
    const guildInvites = await guild.invites.fetch();
    const inviteEntities = await this.database.find(InviteEntity, {});

    /// delete if not exist invite in guild
    for (const inviteEntity of inviteEntities) {
      if (!guildInvites.has(inviteEntity.invite_id)) {
        this.database.remove(inviteEntity);
      }
    }

    /// adding or updating exists invite in guild
    for (const invite of guildInvites.values()) {
      if (invite.inviter.bot) continue;

      let inviteEntity = inviteEntities.find(
        (entity) => entity.invite_id === invite.code,
      );
      if (!inviteEntity) {
        inviteEntity = this.database.create(InviteEntity, {
          invite_id: invite.code,
        });
      }

      inviteEntity.createdAt = invite.createdAt;
      inviteEntity.uses = invite.uses;
      inviteEntity.inviter = invite.inviter.id;

      this.database.persist(inviteEntity);
    }
    await this.database.flush();
  }

  async findRecentUpdated(guild: Guild) {
    const inviteEntities = await this.database.find(InviteEntity, {});
    const invites = await guild.invites.fetch();

    for (const invite of invites.values()) {
      const inviteEntity = inviteEntities.find(
        (entity) => entity.invite_id === invite.code,
      );

      if (inviteEntity && inviteEntity.uses < invite.uses) {
        inviteEntity.uses = invite.uses;
        await this.database.persistAndFlush(inviteEntity);
        return inviteEntity;
      }
    }
  }
}
