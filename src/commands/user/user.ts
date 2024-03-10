import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import { ChatInputCommandInteraction, EmbedBuilder, Message } from 'discord.js';

import { UserService } from '#base/services/user.service';
import { getDisplayAvatar, getRelativeFormat, getTimeInfo } from '#lib/utils';

const enum Options {
  User = 'user',
}

@ApplyOptions<Command.Options>({
  name: 'user',
  description: 'Информация о себе/пользователе',
  aliases: ['u'],
})
export class UserCommand extends Command {
  override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((input) =>
          input
            .setName(Options.User)
            .setDescription('Другой пользователь')
            .setRequired(false),
        ),
    );
  }

  override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const target =
      interaction.options.getUser(Options.User, false) ?? interaction.user;
    const embed = await this.getInfo(target.id);
    await interaction.reply({
      embeds: [embed],
    });
  }
  override async messageRun(message: Message) {
    const target =
      message.mentions.users.map((user) => user.id).at(0) ?? message.author.id;
    const embed = await this.getInfo(target);
    await message.channel.send({ embeds: [embed] });
  }

  private async getInfo(user_id: string) {
    const guild = this.container.rgd;
    const member = await guild.members.fetch(user_id);
    const user = await UserService.Instance.get(user_id);

    const embed = new EmbedBuilder();
    embed.setColor(member.displayColor);
    embed.setThumbnail(getDisplayAvatar(member.user));

    const inVoice = getTimeInfo(user.voice_time).toString();

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
        value: getRelativeFormat(user.first_join.getTime()),
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
        value: inVoice,
        inline: true,
      },
      { name: 'Ливал раз', value: `${user.leave_count}`, inline: true },
    );

    return embed;
  }
}
