import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

import { EnvironmentVariables } from '#config/env';

import { IS_PUBLIC_KEY } from './auth.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }
}

@Injectable()
export class DiscordAuthGuard extends AuthGuard('discord') {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {
    super();
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const guildId = request.query.guild_id;

    if (typeof guildId !== 'string' || guildId.length === 0) {
      return undefined;
    }

    const callbackUrl = new URL(
      this.configService.getOrThrow<string>('DISCORD_REDIRECT_URI'),
    );
    callbackUrl.searchParams.set('guild_id', guildId);

    return {
      callbackURL: callbackUrl.toString(),
    };
  }
}
