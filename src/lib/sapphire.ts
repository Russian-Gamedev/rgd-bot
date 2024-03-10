import type { ChatInputCommand } from '@sapphire/framework';
import { codeBlock } from 'discord.js';

export async function replyWithError(
  interaction: ChatInputCommand.Interaction,
  message: string,
  internal = false,
) {
  const errorType = internal ? 'Внутренняя ошибка' : 'Ошибка';

  if (interaction.deferred) {
    return interaction.editReply({
      content: `${errorType}: ${message}`,
    });
  }

  return interaction.reply({
    content: `${errorType}: ${message}`,
    ephemeral: true,
  });
}

export function replyAnswer(
  interaction: ChatInputCommand.Interaction,
  text: string,
) {
  return interaction.reply({
    embeds: [{ description: text }],
  });
}

export function replyJson(
  interaction: ChatInputCommand.Interaction,
  json: object,
) {
  return interaction.reply({
    content: codeBlock('json', JSON.stringify(json, null, 2)),
    ephemeral: true,
  });
}
