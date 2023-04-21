import { replyAnswer } from '@/lib/helpers/sapphire';
import { ApplyOptions } from '@sapphire/decorators';
import {
  type CommandOptions,
  CommandOptionsRunTypeEnum,
  type ChatInputCommand,
} from '@sapphire/framework';
import { ChatInputCommandInteraction } from 'discord.js';
import { BaseCommand } from '@/lib/sapphire/base-command';
import { User } from '@/lib/directus/directus-entities/User';

const OPTIONS = {
  USER: 'user',
};

@ApplyOptions<CommandOptions>({
  description: 'Кто пригласил',
  runIn: [CommandOptionsRunTypeEnum.GuildText],
})
export class BannerCommand extends BaseCommand {
  override registerApplicationCommands(registry: ChatInputCommand.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addUserOption((option) =>
          option
            .setName(OPTIONS.USER)
            .setDescription('Пользователь, которого нужно баннер')
            .setRequired(true),
        ),
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const member = interaction.options.getUser(OPTIONS.USER, true);

    const { invite } = await User.findOne(member.id, {
      fields: 'invite.*',
    });
    if (!invite || typeof invite === 'string') {
      return replyAnswer(
        interaction,
        `<@${member.id}> олдфаг, неизвестно откуда пришел`,
      );
    }

    if (invite.alias) {
      return replyAnswer(
        interaction,
        `<@${member.id}> прибыл из ${invite.alias}`,
      );
    }

    if (invite.inviter) {
      return replyAnswer(
        interaction,
        `<@${member.id}> приглашен <@${invite.inviter}>`,
      );
    }

    return replyAnswer(interaction, `<@${member.id}> мутный чел какой-то`);
  }
}
