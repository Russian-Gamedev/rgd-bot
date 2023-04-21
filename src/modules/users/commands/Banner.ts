import { replyWithError } from '@/lib/helpers/sapphire';
import { ApplyOptions } from '@sapphire/decorators';
import {
  type CommandOptions,
  CommandOptionsRunTypeEnum,
  type ChatInputCommand,
} from '@sapphire/framework';
import { ChatInputCommandInteraction } from 'discord.js';
import { BaseCommand } from '@/lib/sapphire/base-command';

const OPTIONS = {
  USER: 'user',
};

@ApplyOptions<CommandOptions>({
  description: 'Получить баннер',
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
    const user = await member.fetch();

    const banner = user.bannerURL({ extension: 'webp', size: 4096 });

    if (banner) {
      return interaction.reply(banner);
    }

    return replyWithError(interaction, 'У пользователя нет баннера');
  }
}
