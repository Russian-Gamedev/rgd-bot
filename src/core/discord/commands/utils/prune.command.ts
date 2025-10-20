import { Injectable } from '@nestjs/common';
import { MessageFlags } from 'discord.js';
import {
  Context,
  Options,
  SlashCommand,
  type SlashCommandContext,
  StringOption,
} from 'necord';

class PruneDto {
  @StringOption({
    name: 'count',
    description: 'Number of messages to prune',
    required: true,
  })
  count: number;

  @StringOption({
    name: 'before',
    description: 'Message ID to prune before',
    required: false,
  })
  before?: string;
}

@Injectable()
export class PruneCommand {
  @SlashCommand({
    name: 'prune',
    description: 'Prune messages in a channel',
    defaultMemberPermissions: ['ManageMessages'],
  })
  async prune(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: PruneDto,
  ) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const count = dto.count;
    if (isNaN(count) || count < 1 || count > 100) {
      return interaction.reply({
        content: 'Please provide a valid number between 1 and 100.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const before = dto.before;

    const messages = await interaction.channel?.messages.fetch({
      limit: count,
      before,
    });

    if (!messages || messages.size === 0) {
      return interaction.reply({
        content: 'No messages found to prune.',
        flags: MessageFlags.Ephemeral,
      });
    }

    for (const message of messages.values()) {
      try {
        await message.delete();
      } catch {
        ///
      }
    }

    return interaction.editReply({
      content: `Successfully pruned ${messages.size} messages. ${before ? `before message ID: ${before}` : ''}`,
    });
  }
}
