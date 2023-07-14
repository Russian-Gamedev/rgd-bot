import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import { Time } from '@sapphire/time-utilities';
import { ChatInputCommandInteraction } from 'discord.js';

import { SERVER_ID } from '@/configs/constants';
import { ReputationList, User } from '@/lib/database/entities';
import { LocalStorage } from '@/lib/local-storage';
import { getRelativeFormat } from '@/lib/utils';

@ApplyOptions<Command.Options>({
  name: 'respect',
  description: 'Проявить уважение участнику',
})
export class PressFToPayRespectCommand extends Command {
  override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand(
      (builder) =>
        builder
          .setName(this.name)
          .setDescription(this.description)
          .addUserOption((option) =>
            option
              .setName('target')
              .setDescription('Участник')
              .setRequired(true),
          )
          .addStringOption((option) =>
            option
              .setName('reason')
              .setDescription('Причина')
              .setMaxLength(200)
              .setRequired(true),
          ),
      { idHints: ['1129317510316044389'] },
    );
  }

  override async chatInputRun(
    interaction: ChatInputCommandInteraction,
  ): Promise<any> {
    if (interaction.guildId != SERVER_ID) return;

    const targetUser = interaction.options.getUser('target', true);
    const reason = interaction.options.getString('reason', true);
    const targetMember = await this.container.rgd.members.fetch(targetUser.id);

    if (interaction.user.id === targetMember.id) {
      return interaction.reply({
        content: 'Нельзя уважать самого себя',
        ephemeral: true,
      });
    }

    const lastRespect = LocalStorage.getUserItem(
      interaction.user.id,
      'respect-cool-down',
      0,
    );

    if (Date.now() - lastRespect < Time.Minute * 5) {
      return interaction.reply({
        content:
          'Можно только один раз в день, следующий будет ' +
          getRelativeFormat(lastRespect + Time.Minute * 5),
        ephemeral: true,
      });
    }

    const rep = ReputationList.create({
      reason,
      fromId: interaction.user.id,
      targetId: targetMember.id,
    });
    await rep.save();

    const user = await User.ensure(targetMember);
    user.reputation++;
    await user.save();

    LocalStorage.setUserItem(
      interaction.user.id,
      'respect-cool-down',
      Date.now(),
    );

    await interaction.reply({
      content: `${interaction.user.toString()} проявил уважение ${targetMember.toString()}, и оно повысилось до \`${
        user.reputation
      }\``,
      embeds: [
        {
          title: 'Причина',
          description: reason,
          color: targetMember.displayColor,
        },
      ],
    });
  }
}
