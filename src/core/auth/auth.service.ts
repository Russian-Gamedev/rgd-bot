import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UserEntity } from '#core/users/entities/user.entity';
import { UserService } from '#core/users/users.service';

import { AuthEntity } from './entities/auth.entity';
import { AuthProfile, JwtPayload } from './auth.type';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(AuthEntity)
    private readonly authRepository: EntityRepository<AuthEntity>,
    private readonly entityManager: EntityManager,
    private readonly userService: UserService,
  ) {}

  async logIn(profile: AuthProfile) {
    console.log(profile);
    let auth = await this.authRepository.findOne(
      {
        guild_id: BigInt(profile.guild_id),
        user: {
          id: Number(profile.user_id),
        },
      },
      { populate: ['user'] },
    );

    if (!auth) {
      const user = await this.userService.findOrCreate(
        profile.guild_id,
        profile.user_id,
      );
      auth = new AuthEntity();
      auth.guild_id = BigInt(profile.guild_id);
      auth.user = user;

      await this.entityManager.persistAndFlush(auth);

      this.logger.log(
        `Created new auth entry for user ${profile.username} in guild ${profile.guild_id}`,
      );
    }
    return this.generateJwtToken(auth.user);
  }

  private generateJwtToken(user: UserEntity) {
    const payload: JwtPayload = {
      user_id: String(user.id),
      guild_id: String(user.guild_id),
      username: user.username,
    };

    const access_token = this.jwtService.sign(payload);

    return { access_token };
  }
}
