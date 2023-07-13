import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

import { Colors, SERVER_ID } from '@/configs/constants';
import { User } from '@/lib/database/entities';
import { getDisplayAvatar, getRelativeFormat, getTimeInfo } from '@/lib/utils';

const enum Options {
  User = 'user',
}

@ApplyOptions({
  name: 'user',
  description: 'Информация о себе/пользователе',
})
export class UserCommand extends Command {
  override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .addUserOption((input) =>
            input
              .setName(Options.User)
              .setDescription('Другой пользователь')
              .setRequired(false),
          ),
      { idHints: ['1127244254356455435'] },
    );
  }

  override async chatInputRun(interaction: ChatInputCommandInteraction) {
    if (interaction.guildId != SERVER_ID) return;

    const target =
      interaction.options.getUser(Options.User, false) ?? interaction.user;
    const member = await this.container.rgd.members.fetch(target.id);
    const user = await User.ensure(member);

    const embed = new EmbedBuilder();
    embed.setColor(Colors.Warning);
    embed.setThumbnail(getDisplayAvatar(member.user));

    const inVoice = getTimeInfo(user.voiceTime);

    embed.setFields(
      {
        name: 'Имя аккаунта',
        value: member.user.username,
        inline: true,
      },
      { name: 'Упоминание', value: `<@${member.id}>`, inline: true },
      {
        name: 'Создан',
        value: getRelativeFormat(member.user.createdTimestamp),
        inline: true,
      },
      {
        name: 'Первый вход',
        value: getRelativeFormat(user.firstJoin.getTime()),
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
        value: `${inVoice.hours} ч ${inVoice.minutes
          .toString()
          .padStart(2, '0')} мин ${inVoice.seconds
          .toString()
          .padStart(2, '0')} сек`,
        inline: true,
      },
      { name: 'Ливал раз', value: `${user.leaveCount}`, inline: true },
    );

    await interaction.reply({
      embeds: [embed],
    });
  }
}
