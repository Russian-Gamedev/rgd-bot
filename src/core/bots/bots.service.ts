import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { Injectable, Logger } from '@nestjs/common';
import crypto from 'crypto';

import { BotEntity } from './entities/bot.entity';
import { BotScope } from './bots.types';

@Injectable()
export class BotsService {
  private readonly logger = new Logger(BotsService.name);

  constructor(
    @InjectRepository(BotEntity)
    private readonly botsRepository: EntityRepository<BotEntity>,
    private readonly entityManager: EntityManager,
  ) {}

  async createBot(name: string, ownerId: bigint, scopes: BotScope[]) {
    const rawToken = 'bot_' + crypto.randomBytes(32).toString('hex');
    const hashedToken = await Bun.password.hash(rawToken, {
      algorithm: 'bcrypt',
    });

    const bot = new BotEntity();
    bot.name = name;
    bot.ownerId = ownerId;
    bot.scopes = scopes;
    bot.tokenHash = hashedToken;

    await this.entityManager.persistAndFlush(bot);

    this.logger.log(`Created new bot with ID ${bot.id} and name ${name}`);

    const access_token = bot.id + ':' + rawToken;

    return { access_token };
  }

  async verifyToken(token: string): Promise<BotEntity | null> {
    const [idStr, tokenStr] = token.split(':', 2);
    const id = parseInt(idStr, 10);
    if (isNaN(id) || !tokenStr) return null;

    const bot = await this.botsRepository.findOne({ id });
    if (!bot) return null;
    const isValid = await Bun.password.verify(
      tokenStr,
      bot.tokenHash,
      'bcrypt',
    );
    return isValid ? bot : null;
  }

  async findByName(name: string): Promise<BotEntity | null> {
    return this.botsRepository.findOne({ name });
  }

  async deleteBot(id: number): Promise<void> {
    const bot = await this.botsRepository.findOne({ id });
    if (!bot) return;
    await this.entityManager.removeAndFlush(bot);
    this.logger.log(`Deleted bot with ID ${id} and name ${bot.name}`);
  }
}
