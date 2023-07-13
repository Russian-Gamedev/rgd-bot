import { ApplyOptions } from '@sapphire/decorators';
import {
  ChatInputCommand,
  Command,
  CommandOptions,
  CommandOptionsRunTypeEnum,
} from '@sapphire/framework';
import { ChatInputCommandInteraction } from 'discord.js';

import { ROLE_IDS, SERVER_ID } from '@/configs/constants';
import { EmojiCoin } from '@/configs/emojies';
import { User } from '@/lib/database/entities';
import { HasRole } from '@/lib/decorators/has-role';
import { replyWithError } from '@/lib/helpers/sapphire';

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

  @HasRole(ROLE_IDS.ACTIVE)
  public override async chatInputRun(
    interaction: ChatInputCommandInteraction,
  ): Promise<any> {
    if (interaction.guildId != SERVER_ID) return;
    const member = await this.container.rgd.members.fetch(interaction.user.id);

    const targetUser = interaction.options.getUser(OPTIONS.USER, true);
    const targetMember = await this.container.rgd.members.fetch(targetUser.id);

    const newName = interaction.options.getString(OPTIONS.NEW_NAME, true);
    const prevNickname = targetMember.nickname || targetMember.user.username;

    if (targetUser.id === this.container.client.id) {
      const user = await User.ensure(member);
      if (user.coins < 10_000) {
        return replyWithError(
          interaction,
          `Чтобы переименовать бота, нужно 10 000 ${EmojiCoin.Top}`,
        );
      }
      user.coins -= 10_000;

      await user.save();
    }

    try {
      await targetMember.setNickname(
        newName,
        `${interaction.user.username} has renamed ${targetMember.user.username}`,
      );
    } catch (e) {
      this.container.logger.error(e);

      return replyWithError(interaction, 'Не удается установить ник', true);
    }

    return interaction.reply({
      content: `Пользователь **${prevNickname}** был переименован в **${newName}**`,
    });
  }
}
