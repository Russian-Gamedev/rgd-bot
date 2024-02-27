import { EntityManager } from '@mikro-orm/postgresql';
import { container } from '@sapphire/pieces';
import { GuildMember, User } from 'discord.js';

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
      const member = await container.client.users.fetch(user_id);

      user = this.database.create(UserEntity, {
        user_id,
        username: member.username,
        avatar: getDisplayAvatar(member),
      });
      user.is_new = true;

      await this.updateInfo(member);
    }

    return user;
  }

  async updateInfo(member: User | GuildMember) {
    const user = await this.get(member.id);
    const _user = member instanceof User ? member : member.user;

    user.username = member.displayName;
    user.avatar = getDisplayAvatar(_user);
    user.banner = getDisplayBanner(_user);
    if (member instanceof GuildMember) {
      user.banner_color = member.displayHexColor;

      if (!user.first_join) {
        user.first_join = member.joinedAt;
      }
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

    for (const role of roles.values()) {
      if (role.name === '@everyone') continue;
      if (role.tags) continue;
      if (saved_roles.some((saved_role) => saved_role.role_id === role.id))
        continue;

      const entity = this.database.create(UserRolesEntity, {
        user_id: member.id,
        role_id: role.id,
      });

      this.database.persist(entity);
    }

    await this.database.flush();
  }
}
