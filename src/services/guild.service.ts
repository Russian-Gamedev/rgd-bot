import { EntityManager } from '@mikro-orm/postgresql';
import { container } from '@sapphire/pieces';
import { Guild } from 'discord.js';

import { GuildEntity } from '#base/entities/guild.entity';
import { RoleEntity } from '#base/entities/role.entity';

export class GuildService {
  private static _instance: GuildService;

  static get Instance() {
    if (!this._instance) {
      const orm = container.orm.em.fork();
      this._instance = new GuildService(orm);
    }
    return this._instance;
  }

  constructor(readonly database: EntityManager) {}

  async get(id: string) {
    let guildEntity = await this.database.findOne(GuildEntity, {
      id,
    });

    if (!guildEntity) {
      guildEntity = this.database.create(GuildEntity, {
        id,
      });

      const entity = await container.client.guilds.fetch(id);
      await this.updateInfo(entity);
    }

    return guildEntity;
  }

  async updateInfo(guild: Guild) {
    const entity = await this.get(guild.id);
    entity.name = guild.name;
    entity.owner_id = guild.ownerId.toString();
    entity.createdAt = guild.createdAt;
    await this.database.persistAndFlush(entity);
  }

  async updateRoles(guild: Guild) {
    const guildRoles = await guild.roles.fetch();
    const roleEntities = await this.database.find(RoleEntity, {
      guild_id: guild.id,
    });

    /// delete if not exists in guild
    for (const roleEntity of roleEntities) {
      if (!guildRoles.has(roleEntity.role_id)) {
        this.database.remove(roleEntity);
      }
    }

    /// adding or updating exists roles in guild
    for (const role of guildRoles.values()) {
      if (role.name === '@everyone') continue;
      if (role.tags) continue; /// bot, nitro roles, etc...

      let roleEntity = roleEntities.find(
        (entity) => entity.role_id === role.id,
      );
      if (!roleEntity) {
        roleEntity = this.database.create(RoleEntity, {
          guild_id: guild.id,
          role_id: role.id,
        });
      }

      roleEntity.name = role.name;
      roleEntity.color = role.hexColor;
      roleEntity.position = role.position;

      this.database.persist(roleEntity);
    }

    await this.database.flush();
  }
}
