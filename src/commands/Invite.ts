import { replyAnswer, replyWithError } from '../lib/helpers/sapphire';
import { ApplyOptions } from '@sapphire/decorators';
import {
  type CommandOptions,
  CommandOptionsRunTypeEnum,
  type ChatInputCommand,
} from '@sapphire/framework';
import { ChatInputCommandInteraction } from 'discord.js';
import { BaseCommand } from '../lib/sapphire/base-command';
import { CHANNEL_IDS } from '../configs/discord-constants';
import { Invites } from '../lib/directus/directus-entities/Discord';

const OPTIONS = {
  Alias: 'alias',
};

@ApplyOptions<CommandOptions>({
  description: 'Создать постоянную ссылку',
  runIn: [CommandOptionsRunTypeEnum.GuildText],
})
export class InviteCommand extends BaseCommand {
  override registerApplicationCommands(registry: ChatInputCommand.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName(this.name)
        .setDescription(this.description)
        .addStringOption((option) =>
          option
            .setName(OPTIONS.Alias)
            .setDescription('Краткое описание')
            .setRequired(true),
        ),
    );
  }

  public override async chatInputRun(interaction: ChatInputCommandInteraction) {
    const alias = interaction.options.getString(OPTIONS.Alias, true);

    const invite = await this.container.rgd.invites.create(
      CHANNEL_IDS.Welcome,
      {
        maxAge: 0,
        maxUses: 0,
        temporary: false,
        unique: true,
      },
    );

    try {
      const directusInvite = await Invites.create({
        alias,
        id: invite.code,
        inviter: interaction.user.id,
        uses: 0,
      });

      if (await directusInvite.save()) {
        return interaction.reply({
          content: `${alias}\nInvite: ` + invite.url,
          ephemeral: true,
        });
      }

      await invite.delete('Сбой');

      return replyWithError(interaction, 'Произошла ошибка :(');
    } catch (e: any) {
      await invite.delete('Сбой');
      return replyWithError(interaction, e.message);
    }
  }
}
