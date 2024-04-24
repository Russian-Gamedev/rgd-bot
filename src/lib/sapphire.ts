import {
  type ChatInputCommand,
  container,
  LogLevel,
} from '@sapphire/framework';
import { codeBlock } from 'discord.js';
import fs from 'fs';

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

export function setupLogFile() {
  const write = container.logger.write;
  const log_file = fs.createWriteStream('./debug.log', {
    flags: 'w',
  });

  container.logger.write = (...args) => {
    const [level, ...message] = args;

    const formatter =
      container.logger['formats'].get(level) ??
      container.logger['formats'].get(LogLevel.None);

    const output = formatter
      .run(container.logger['preprocess'](message))
      .replace(
        /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
        '',
      );

    log_file.write(output + '\n');
    write.call(container.logger, ...args);
  };
}
