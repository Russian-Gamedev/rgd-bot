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

import { Colors, SERVER_ID } from '@/configs/constants';
import { getRelativeFormat } from '@/lib/utils';

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

  override async chatInputRun(interaction: ChatInputCommandInteraction) {
    if (interaction.guildId != SERVER_ID) return;
    const embed = new EmbedBuilder();
    embed.setAuthor({
      name: 'RGD Bot',
      iconURL:
        'https://cdn.discordapp.com/emojis/850081111241785425.gif?size=96&quality=lossless',
    });
    embed.setColor(Colors.Primary);
    embed.setThumbnail(
      'https://cdn.discordapp.com/attachments/958976541696618537/1107780924982177852/504617984594018325.gif',
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
      {
        name: 'Запущен',
        value: getRelativeFormat(this.container.client.readyTimestamp),
      },
    ]);

    const row = new ActionRowBuilder<MessageActionRowComponentBuilder>();

    row.addComponents(
      new ButtonBuilder()
        .setURL('https://github.com/Russian-Gamedev/rgd-bot')
        .setStyle(ButtonStyle.Link)
        .setLabel('Сурсы'),
    );

    await interaction.reply({
      embeds: [embed],
      components: [row],
    });
  }
}
