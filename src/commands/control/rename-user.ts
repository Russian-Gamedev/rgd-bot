import { ApplyOptions } from '@sapphire/decorators';
import {
  ChatInputCommand,
  Command,
  CommandOptions,
  CommandOptionsRunTypeEnum,
} from '@sapphire/framework';
import {
  ChatInputCommandInteraction,
  Guild,
  GuildMember,
  Message,
} from 'discord.js';

import { BotEvents, GuildSettings } from '#base/config/constants';
import { EmojiCoin } from '#base/config/emojies';
import { replyWithError } from '#base/lib/sapphire';
import { BotEventsService } from '#base/services/events.service';
import { GuildSettingService } from '#base/services/guild-setting.service';
import { UserService } from '#base/services/user.service';

const OPTIONS = {
  USER: 'user',
  NEW_NAME: 'new_name',
};

@ApplyOptions<CommandOptions>({
  description: 'Переименовать юзера',
  runIn: [CommandOptionsRunTypeEnum.GuildText],
  name: 'rn',
})
export class RenameCommand extends Command {
  override registerApplicationCommands(registry: ChatInputCommand.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) =>
          option
            .setName(OPTIONS.USER)
            .setDescription('Пользователь, которого нужно переименовать')
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName(OPTIONS.NEW_NAME)
            .setDescription('Новое имя')
            .setRequired(true),
        ),
    );
  }

  public override async messageRun(message: Message) {
    if (message.mentions.users.size > 1) {
      return message.reply({
        content: 'Можно переименовать только одного пользователя!',
      });
    }

    const target = message.mentions.members.at(0) ?? message.member;

    const nickname = message.content
      .replace('!rn ', '')
      .replaceAll(/<@(.*?)>/g, '')
      .trim();

    const { text } = await this.renameUser(
      message.guild,
      message.member,
      target,
      nickname,
    );

    await message.reply({ content: text, allowedMentions: { parse: [] } });
  }

  public override async chatInputRun(
    interaction: ChatInputCommandInteraction,
  ): Promise<any> {
    const targetUser = interaction.options.getUser(OPTIONS.USER, true);
    const targetMember = await interaction.guild.members.fetch(targetUser.id);

    const newName = interaction.options.getString(OPTIONS.NEW_NAME, true);

    const { error, text } = await this.renameUser(
      interaction.guild,
      interaction.member as GuildMember,
      targetMember,
      newName,
    );

    if (error) {
      return replyWithError(interaction, text);
    }
    return interaction.reply(text);
  }

  private async renameUser(
    guild: Guild,
    member: GuildMember,
    target: GuildMember,
    nickname: string,
  ): Promise<{ error: boolean; text: string }> {
    const activeRoleId = await GuildSettingService.Instance.get(
      guild.id,
      GuildSettings.RoleActive,
      '',
    );

    if (!activeRoleId) {
      return {
        error: true,
        text: `Такой роли нет, которая требуется ... что?`,
      };
    }

    if (!member.roles.cache.has(activeRoleId)) {
      return {
        error: true,
        text: `У вас нет роли <@&${activeRoleId}>`,
      };
    }

    const prevNickname = target.nickname || target.user.username;

    if (target.id === this.container.client.id) {
      const user = await UserService.Instance.get(guild.id, member.id);
      if (user.coins < 10_000) {
        return {
          error: true,
          text: `Чтобы переименовать бота, нужно 10 000 ${EmojiCoin.Top}`,
        };
      }
      user.coins -= 10_000;

      await UserService.Instance.database.persistAndFlush(user);
    }

    const message = await BotEventsService.Instance.getRandom(
      guild.id,
      BotEvents.MEMBER_SET_NAME,
      {
        user: `**${prevNickname}**`,
        nickname: `**${nickname}**`,
      },
    );

    try {
      await target.setNickname(
        nickname,
        message + '. By ' + member.displayName,
      );
    } catch (e) {
      this.container.logger.error(e);

      return {
        error: true,
        text: 'Не удается установить ник',
      };
    }

    return {
      error: false,
      text: message,
    };
  }
}
