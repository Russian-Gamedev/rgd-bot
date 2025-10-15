import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as path from 'path';

import { EnvironmentVariables } from '#config/env';

import './lib/polyfill';

import { AppModule } from './app.module';

async function getSwaggerCustom() {
  const assetsDir = path.join(__dirname, '../assets/swagger');
  const customCss = await Bun.file(path.join(assetsDir, 'custom.css')).text();
  const customJs = await Bun.file(path.join(assetsDir, 'custom.js')).text();

  return { customCss, customJs };
}

async function main() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService<EnvironmentVariables>);
  const reflector = app.get(Reflector);

  app.enableShutdownHooks();
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  const PackageJSON = await Bun.file('./package.json').json();

  const documentBuilder = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('Взаимодействие с ботом через внешние сервисы bot.rgd.chat')
    .setVersion(PackageJSON.version)
    .build();

  const document = SwaggerModule.createDocument(app, documentBuilder);

  const { customCss, customJs } = await getSwaggerCustom();
  SwaggerModule.setup('docs', app, document, {
    customCss,
    customJs,
    customfavIcon: '/favicon.ico',
    customSiteTitle: 'RGD Bot API Docs',
  });

  const port = config.get<number>('PORT', 3000);
  await app.listen(port, '0.0.0.0');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
