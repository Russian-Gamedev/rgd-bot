import { EntityManager } from '@mikro-orm/postgresql';
import { container } from '@sapphire/pieces';
import { GuildMember } from 'discord.js';

import { UserEntity } from '#base/entities/user.entity';
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
}
