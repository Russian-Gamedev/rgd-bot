import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

import { EnvironmentVariables } from '#config/env';

import { AuthService } from './auth.service';
import { AuthProfile } from './auth.type';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  @Get('/discord')
  @UseGuards(AuthGuard('discord'))
  async login() {
    ///
  }

  @Get('/discord/callback')
  @UseGuards(AuthGuard('discord'))
  async callback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const redirectUri = this.configService.getOrThrow<string>(
      'DISCORD_REDIRECT_URI',
    );

    ///@ts-expect-error -- req.user is added by passport
    const access_token = await this.authService.logIn(req.user as AuthProfile);

    const url = new URL(redirectUri);
    url.pathname = '/';
    url.searchParams.append('access_token', access_token.access_token);

    if (req.headers['content-type']?.includes('application/json')) {
      res.json({ access_token: access_token.access_token });
      return;
    }

    res.redirect(url.toString());
  }
}
