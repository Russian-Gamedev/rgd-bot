import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-discord';

import { EnvironmentVariables } from '#config/env';

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
  constructor(config: ConfigService<EnvironmentVariables>) {
    super({
      clientID: config.getOrThrow<string>('DISCORD_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('DISCORD_CLIENT_SECRET'),
      callbackURL: config.getOrThrow<string>('DISCORD_REDIRECT_URI'),
      scope: ['identify', 'guilds'],
    });
  }

  async validate(
    access_token: string,
    refresh_token: string,
    profile: {
      id: string;
      username: string;
    },
  ) {
    console.log(profile);
    return {
      user_id: profile.id,
      guild_id: '504617984594018325', // Temporary fix until we implement guild selection
      username: profile.username,
    };
  }
}
