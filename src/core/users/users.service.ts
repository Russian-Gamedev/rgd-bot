import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import { Client } from 'discord.js';

import { getDisplayAvatar } from '#root/lib/utils';

import { UserEntity } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: EntityRepository<UserEntity>,
    private readonly em: EntityManager,
    private readonly client: Client,
  ) {}

  async findOrCreate(guildId: bigint, userId: bigint): Promise<UserEntity> {
    let user = await this.userRepository.findOne({
      id: userId,
      guild_id: guildId,
    });
    if (!user) {
      user = new UserEntity();
      user.id = userId;
      user.guild_id = guildId;
      await this.updateUserData(user);
    }
    return user;
  }

  async getNewUsers(since: Date, guildId: bigint): Promise<UserEntity[]> {
    return this.userRepository.find({
      createdAt: { $gte: since },
      guild_id: guildId,
    });
  }

  async updateUserData(user: UserEntity): Promise<void> {
    const guild = await this.client.guilds.fetch(user.guild_id.toString());
    if (!guild) return;
    const discordUser = await guild.members.fetch(user.id.toString());
    if (!discordUser) return;
    user.username = discordUser.displayName;
    user.avatar = getDisplayAvatar(discordUser);
    user.banner = discordUser.bannerURL() ?? null;
    user.banner_color = discordUser.displayHexColor ?? '#fff';
    user.first_joined_at ??= discordUser.joinedAt ?? new Date();
    await this.em.persistAndFlush(user);
  }

  async addExperience(user: UserEntity, amount: number): Promise<void> {
    user.experience += amount;
    await this.em.persistAndFlush(user);
  }

  async addReputation(user: UserEntity, amount: number): Promise<void> {
    user.reputation += amount;
    await this.em.persistAndFlush(user);
  }

  async addCoins(user: UserEntity, amount: number): Promise<void> {
    user.coins += amount;
    await this.em.persistAndFlush(user);
  }

  async addVoiceTime(user: UserEntity, amount: number): Promise<void> {
    user.voice_time += amount;
    await this.em.persistAndFlush(user);
  }
}
