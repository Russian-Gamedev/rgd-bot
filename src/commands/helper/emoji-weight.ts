import { ApplyOptions } from '@sapphire/decorators';
import { SnowflakeRegex } from '@sapphire/discord-utilities';
import {
  ApplicationCommandRegistry,
  Command,
  CommandOptionsRunTypeEnum,
} from '@sapphire/framework';
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

import { SERVER_ID } from '@/configs/constants';
import { EmojiWeight } from '@/configs/emoji-weight';

@ApplyOptions<Command.Options>({
  name: 'emoji-weight',
  description: 'Список эмоджи и их веса',
  runIn: [CommandOptionsRunTypeEnum.GuildText],
})
export class EmojiWeightCommand extends Command {
  override registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand(
      (builder) => builder.setName(this.name).setDescription(this.description),
      {
        idHints: ['1128704242706813009'],
      },
    );
  }

  override async chatInputRun(interaction: ChatInputCommandInteraction) {
    if (interaction.guildId != SERVER_ID) return;
    const embed = new EmbedBuilder();

    embed.setTitle('Список эмоджи с весами');

    let text = '';
    for (const [emoji_id, weight] of Object.entries(EmojiWeight)) {
      if (SnowflakeRegex.test(emoji_id)) {
        const emoji = this.container.client.emojis.cache.get(emoji_id);
        if (!emoji) continue;
        text += `${emoji.toString()}`;
      } else {
        text += `${emoji_id}`;
      }
      text += ` \`${weight}\`\n`;
    }

    embed.setDescription(text);

    await interaction.reply({ embeds: [embed] });
  }
}
