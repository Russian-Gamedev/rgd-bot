import { createParamDecorator } from '@nestjs/common';

export const BotTarget = createParamDecorator((_, ctx) => {
  const request = ctx.switchToHttp().getRequest();
  return request.bot;
});
