import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { BotsService } from './bots.service';
import { BotScope } from './bots.types';

const METADATA_KEY = 'bot_scopes';

export const BotScopes = (...scopes: BotScope[]) =>
  SetMetadata(METADATA_KEY, scopes);

@Injectable()
export class BotApiGuard implements CanActivate {
  constructor(
    private readonly botsService: BotsService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    if (!authHeader) return false;

    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) return false;

    const bot = await this.botsService.verifyToken(token);

    if (!bot) throw new ForbiddenException('Invalid bot token');
    request.bot = bot;

    const requiredScopes = this.reflector.get<BotScope[]>(
      METADATA_KEY,
      context.getHandler(),
    );

    if (!requiredScopes) return true;

    return requiredScopes.every((scope) => bot.scopes.includes(scope));
  }
}
