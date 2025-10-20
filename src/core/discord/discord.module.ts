import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntentsBitField, Partials } from 'discord.js';
import { NecordModule } from 'necord';

import { AppConfigModule } from '#common/config/config.module';
import { Environment, EnvironmentVariables } from '#config/env';

import { commands } from './commands';
import { DiscordController } from './discord.controller';
import { DiscordService } from './discord.service';

@Module({
  imports: [
    NecordModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables>) => ({
        token: config.getOrThrow<string>('DISCORD_BOT_TOKEN'),
        intents: [
          IntentsBitField.Flags.Guilds,
          IntentsBitField.Flags.GuildMembers,
          IntentsBitField.Flags.GuildMessages,
          IntentsBitField.Flags.GuildMessageReactions,
          IntentsBitField.Flags.GuildPresences,
          IntentsBitField.Flags.GuildVoiceStates,
          IntentsBitField.Flags.GuildInvites,
          IntentsBitField.Flags.MessageContent,
          IntentsBitField.Flags.GuildModeration,
          IntentsBitField.Flags.GuildIntegrations,
        ],
        partials: [
          Partials.Channel,
          Partials.Message,
          Partials.Reaction,
          Partials.GuildMember,
          Partials.User,
        ],
        development:
          config.get('NODE_ENV') === Environment.Development
            ? [config.getOrThrow<string>('DISCORD_DEVELOPMENT_GUILD_ID')]
            : false,
      }),
    }),
  ],
  providers: [DiscordService, ...commands],
  controllers: [DiscordController],
})
export class DiscordModule {}
