import { EmbedBuilder } from 'discord.js';

import { SIGameEmbed, SIGameQuestion } from './engine/sigame.pack';
import { SIGameState } from './engine/sigame.state';
import { getFlags } from './engine/utils';

export const SIGameColor = 0x030751;
export const SIGameAvatar =
  'https://github.com/VladimirKhil/SIOnline/blob/master/assets/images/sigame.png?raw=true';

const images = ['png', 'jpg', 'jpeg', 'gif'];

interface Attach {
  attachment: string;
  name: string;
  type: string;
}

export class SIGameEmbedBuilder {
  static buildQuestion(game: SIGameState) {
    const state = game.getCurrentState();
    if (!state) return null;
    const { question, round, theme } = state;

    const title = `Тема: ${theme.name} (${game.currentQuestionIndex + 1}/${theme.questions.length})`;

    const embed = new EmbedBuilder()
      .setColor(SIGameColor)
      .setAuthor({
        name: title,
        iconURL: SIGameAvatar,
      })
      .setFooter({
        text: `${round.name} | ${question.price} | ${game.pack.name}`,
      });

    let description = '';

    const texts = question.question.flatMap((q) => q.text);

    if (texts.length > 0) {
      description += '❓ ';
      if (question.type === 'content') {
        for (const qPart of texts) {
          description += qPart + '\n';
        }
      } else {
        description += texts[0] + '\n\nВаринты ответов:\n';
        for (let i = 1; i < texts.length; i++) {
          description += `• ${texts[i]}\n`;
        }
      }

      description += '\n';
    }

    const flags = getFlags(
      question.answer.map((q) => q.text.join(' ')).join(' '),
    );

    description += `Языки: ${flags.join('/')}`;

    embed.setDescription(description);

    return this.addFilesToEmbed(embed, question.question);
  }

  static buildAnswer(question: SIGameQuestion) {
    const answer = question.answer
      .map((embed) => embed.text.join(' '))
      .join(', ');

    const embed = new EmbedBuilder()
      .setDescription(`Ответ: \`${answer}\``)
      .setColor(SIGameColor);

    return this.addFilesToEmbed(embed, question.answer);
  }

  private static addFilesToEmbed(
    embed: EmbedBuilder,
    siEmbends: SIGameEmbed[],
  ) {
    const files = siEmbends.map((embed) => embed.files).flat();

    const attachments: Attach[] = [];

    for (let i = 0; i < files.length; i++) {
      const fileExt = files[i].split('.').pop()!.toLowerCase();
      const fileName = `question${i}.${fileExt}`;
      attachments.push({ attachment: files[i], name: fileName, type: fileExt });
    }

    for (const attach of attachments) {
      if (images.includes(attach.type)) {
        embed.setImage(`attachment://${attach.name}`);
      }
    }

    return { embed, files: attachments };
  }
}
