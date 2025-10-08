import { EmbedBuilder } from '@discordjs/builders';
import { Injectable } from '@nestjs/common';
import { GuildMember } from 'discord.js';
import {
  Context,
  MemberOption,
  Options,
  SlashCommand,
  type SlashCommandContext,
} from 'necord';

import { getDisplayAvatar, getRelativeFormat } from '#root/lib/utils';

import { UserService } from '../users.service';

class GetUserDto {
  @MemberOption({
    name: 'user',
    required: false,
    description: 'Другой пользователь',
  })
  member: GuildMember;
}

@Injectable()
export class UserCommands {
  constructor(private readonly userService: UserService) {}

  @SlashCommand({
    name: 'user',
    description: 'Информация о себе/пользователе',
  })
  async getUserInfo(
    @Context() [interaction]: SlashCommandContext,
    @Options() { member }: GetUserDto,
  ) {
    const guild = interaction.guild;
    if (!guild) return;
    const guildId = BigInt(guild.id);
    const targetId = BigInt(member?.id ?? interaction.user.id);
    const target = await guild.members.fetch(targetId.toString());
    if (!target) return;
    const user = await this.userService.findOrCreate(guildId, targetId);

    const embed = new EmbedBuilder();

    embed.setColor(target.displayColor);
    embed.setThumbnail(getDisplayAvatar(target.user));

    embed.setFields([
      {
        name: 'Имя аккаунта',
        value: target.user.username,
        inline: true,
      },
      { name: 'Упоминание', value: `<@${target.id}>`, inline: true },
      {
        name: 'Создан',
        value: getRelativeFormat(target.user.createdTimestamp),
        inline: true,
      },
      {
        name: 'Первый вход',
        value: getRelativeFormat(user.first_joined_at.getTime()),
        inline: true,
      },
      {
        name: 'Уровень уважения',
        value: user.reputation.toLocaleString('ru'),
        inline: true,
      },
      { name: 'Баланс', value: user.coins.toLocaleString('ru'), inline: true },
      {
        name: 'Понаписал',
        value: user.experience.toLocaleString('ru'),
        inline: true,
      },
      {
        name: 'Наговорил',
        value: user.voice_time.toLocaleString('ru'),
        inline: true,
      },
      { name: 'Ливал раз', value: `${user.left_count}`, inline: true },
    ]);

    return interaction.reply({ embeds: [embed] });
  }
}
