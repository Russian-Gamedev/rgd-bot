import { GuildSettings } from '#core/guilds/entities/guild-settings.entity';
import { Injectable, UseInterceptors } from '@nestjs/common';
import { MessageFlags } from 'discord.js';
import { Context, type SlashCommandContext, Options, Subcommand } from 'necord';
import { SetSettingDto } from '../dto/set-setting.dto';
import { SettingsAutoCompleteInterceptor } from '../SettingsAutoComplete.interceptor';
import { GuildSettingsService } from '../guild-settings.service';
import { SettingsCommandDecorator } from './group.decorator';

@SettingsCommandDecorator()
@Injectable()
export class SetGuildSettingsCommand {
  constructor(private readonly guildSettingsService: GuildSettingsService) {}

  @UseInterceptors(SettingsAutoCompleteInterceptor)
  @Subcommand({
    name: 'set-raw',
    description: 'Set a guild setting',
  })
  public async setRawSettings(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: SetSettingDto<string>,
  ) {
    const { key, value } = dto;

    const validSettingKey = Object.values(GuildSettings).some(
      (setting) => setting === key,
    );
    if (!validSettingKey) {
      return await interaction.reply({
        content: 'Invalid setting key.',
        flags: [MessageFlags.Ephemeral],
      });
    }

    await this.guildSettingsService.setSetting(
      BigInt(interaction.guildId!),
      key,
      value,
    );
    await interaction.reply(`Setting \`${key}\` updated to \`${value}\`.`);
  }
}
