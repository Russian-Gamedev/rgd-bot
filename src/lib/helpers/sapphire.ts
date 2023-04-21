import type { ChatInputCommand } from '@sapphire/framework';

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
