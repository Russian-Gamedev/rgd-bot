import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { EnvironmentVariables } from '#config/env';

import { AppModule } from './app.module';

async function main() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService<EnvironmentVariables>);

  app.enableShutdownHooks();
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = config.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
