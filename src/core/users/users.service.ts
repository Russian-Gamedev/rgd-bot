import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';

import { UserEntity } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: EntityRepository<UserEntity>,
    private readonly em: EntityManager,
  ) {}

  async findOrCreate(userId: bigint): Promise<UserEntity> {
    let user = await this.userRepository.findOne({ id: userId });
    if (!user) {
      user = new UserEntity();
      user.id = userId;
      await this.em.persistAndFlush(user);
    }
    return user;
  }

  async getNewUsers(since: Date): Promise<UserEntity[]> {
    return this.userRepository.find({ createdAt: { $gte: since } });
  }
}
