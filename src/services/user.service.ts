import { EntityManager } from '@mikro-orm/postgresql';
import { container } from '@sapphire/pieces';
import { GuildMember } from 'discord.js';

import { UserEntity } from '#base/entities/user.entity';
import { UserRolesEntity } from '#base/entities/user-roles.entity';
import { getDisplayAvatar, getDisplayBanner } from '#lib/utils';

export class UserService {
  private static _instance: UserService;

  static get Instance() {
    if (!this._instance) {
      const orm = container.orm.em.fork();
      this._instance = new UserService(orm);
    }
    return this._instance;
  }

  constructor(readonly database: EntityManager) {}

  async get(user_id: string) {
    let user = await this.database.findOne(UserEntity, { user_id });
    if (!user) {
      const guild = await container.client.guilds.fetch('');
      const member = await guild.members.fetch(user_id);

      user = this.database.create(UserEntity, {
        user_id,
        username: member.user.username,
        avatar: getDisplayAvatar(member.user),
      });
      user.is_new = true;

      await this.updateInfo(member);
    }

    return user;
  }

  async updateInfo(member: GuildMember) {
    const user = await this.get(member.user.id);

    user.username = member.user.username;
    user.avatar = getDisplayAvatar(member.user);
    user.banner = getDisplayBanner(member.user);
    user.banner_color = member.displayHexColor;

    if (!user.first_join) {
      user.first_join = member.joinedAt;
    }

    await this.database.persistAndFlush(user);
  }

  async loadRoles(member: GuildMember) {
    const roles = await this.database.find(UserRolesEntity, {
      user_id: member.id,
    });

    await Promise.all(roles.map((role) => member.roles.add(role.role_id)));
  }

  async saveRoles(member: GuildMember) {
    const roles = member.roles.cache;

    const saved_roles = await this.database.find(UserRolesEntity, {
      user_id: member.id,
    });

    /// delete if not exist in members
    for (const role of saved_roles) {
      if (!roles.has(role.role_id)) {
        this.database.remove(role);
      }
    }

    const needSave = roles.filter(
      (role) =>
        !saved_roles.every((saved_role) => saved_role.role_id === role.id),
    );

    console.log(needSave);

    for (const role of needSave.values()) {
      const entity = this.database.create(UserRolesEntity, {
        user_id: member.id,
        role_id: role.id,
      });

      this.database.persist(entity);
    }

    await this.database.flush();
  }
}
