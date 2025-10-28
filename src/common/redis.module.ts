import { Logger, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { EnvironmentVariables } from '#config/env';

const redisProvider: Provider = {
  useFactory: (config: ConfigService<EnvironmentVariables>) => {
    const logger = new Logger('RedisModule');
    const client = new Redis(
      config.get<string>('REDIS_URL', 'redis://localhost:6379'),
    );
    client.once('connect', () => {
      logger.log('Connected to Redis');
    });
    return client;
  },
  inject: [ConfigService],
  provide: Redis,
};

@Module({
  providers: [redisProvider],
  exports: [redisProvider],
})
export class RedisModule {}
