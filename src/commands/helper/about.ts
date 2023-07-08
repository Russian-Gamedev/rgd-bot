import { ApplyOptions } from '@sapphire/decorators';
import { ApplicationCommandRegistry, Command } from '@sapphire/framework';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageActionRowComponentBuilder,
} from 'discord.js';

import { Colors } from '@/configs/constants';

@ApplyOptions({
  name: 'about',
  description: 'Информация об боте',
})
export class AboutCommand extends Command {
  override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand(
      (builder) => builder.setName(this.name).setDescription(this.description),
      { idHints: ['1127245754730287114'] },
    );
  }

  override chatInputRun(interaction: ChatInputCommandInteraction) {
    const embed = new EmbedBuilder();
    embed.setAuthor({
      name: 'RGD Bot',
      iconURL: interaction.client.user.displayAvatarURL(),
    });
    embed.setColor(Colors.Primary);
    embed.setThumbnail(
      'https://cdn.discordapp.com/attachments/735105892264968234/745941444044390400/YxQQFFHzypg.png',
    );

    const authors = ['357130048882343937', '371690693233737740'];

    embed.addFields([
      {
        name: 'Написан на',
        value: '<:typescript:1127255595653804084> TypeScript',
        inline: true,
      },
      {
        name: 'Используется',
        value: '<:sapphire:1127255594131279992> SapphireJS',
        inline: true,
      },
      {
        name: 'Авторы',
        value: authors.map((id) => `<@${id}>`).join(', '),
        inline: false,
      },
    ]);

    const row = new ActionRowBuilder<MessageActionRowComponentBuilder>();

    row.addComponents(
      new ButtonBuilder()
        .setURL('https://github.com/Russian-Gamedev/rgd-bot')
        .setStyle(ButtonStyle.Link)
        .setLabel('Сурсы'),
    );

    return interaction.reply({
      embeds: [embed],
      components: [row],
    });
  }
}
