import { XMLParser } from 'fast-xml-parser';

import {
  SIGameEmbed,
  SIGamePack,
  SIGameQuestion,
  SIGameQuestionType,
  SIGameRound,
  SIGameTheme,
} from '../sigame.pack';
import { XMLNormalizer } from '../utils';

import { SIGamePackParser } from '.';

export class SIGameParserSIQ extends SIGamePackParser {
  canParse(content: string): boolean {
    return content.includes('siq_5.xsd');
  }

  async parse(content: string) {
    const pack = new SIGamePack();

    const xml = new XMLParser({
      ignoreAttributes: false,
      alwaysCreateTextNode: true,
    }).parse(content);

    await Bun.write('temp/siq-parsed.json', JSON.stringify(xml, null, 2));

    pack.name = XMLNormalizer.getAttribute(
      xml.package,
      'name',
      '<Unknown Pack>',
    );
    pack.date = XMLNormalizer.getAttribute(
      xml.package,
      'date',
      '<Unknown Date>',
    );
    pack.logo = XMLNormalizer.getAttribute(xml.package, 'logo', '');

    const rounds = xml.package.rounds.round;
    for (const roundXml of rounds) {
      const round = new SIGameRound();
      round.name = XMLNormalizer.getAttribute(
        roundXml,
        'name',
        `${rounds.indexOf(roundXml) + 1}-й раунд`,
      );
      pack.rounds.push(round);

      const themes = XMLNormalizer.toArray(roundXml.themes?.theme);
      for (const themeXml of themes) {
        const theme = new SIGameTheme();
        theme.name = XMLNormalizer.getAttribute(
          themeXml,
          'name',
          `Тема ${themes.indexOf(themeXml) + 1}`,
        );
        round.themes.push(theme);

        const questions = XMLNormalizer.toArray(themeXml.questions?.question);
        for (const questionXml of questions) {
          const question = new SIGameQuestion();
          question.price = Number(
            XMLNormalizer.getAttribute(questionXml, 'price', '0'),
          );
          theme.questions.push(question);

          const params = XMLNormalizer.toArray(questionXml.params.param);
          const answer = XMLNormalizer.toArray(questionXml.right.answer);

          const atomEmbed = new SIGameEmbed();
          question.question.push(atomEmbed);

          for (const param of params) {
            const itemType = XMLNormalizer.getAttribute(param, 'name', 'text');
            const items = XMLNormalizer.toArray(param.item);
            switch (itemType) {
              case 'question': {
                for (const item of items) {
                  const text = XMLNormalizer.getText(item, '');
                  const type = XMLNormalizer.getAttribute(item, 'type', 'text');

                  if (type === 'text') {
                    atomEmbed.text.push(text);
                  } else {
                    atomEmbed.files.push(text);
                  }
                }
                break;
              }
              case 'answer': {
                answer.push(...items);
                break;
              }
              case 'answerType': {
                question.type = XMLNormalizer.getText(
                  param,
                  'content',
                ) as SIGameQuestionType;
                break;
              }
              case 'answerOptions': {
                for (const option of param.param) {
                  const items = XMLNormalizer.toArray(option.item);
                  for (const item of items) {
                    const optionText = XMLNormalizer.getText(item, '');
                    const optionVariant = XMLNormalizer.getAttribute(
                      option,
                      'name',
                      'text',
                    );
                    atomEmbed.text.push(`${optionVariant}: ${optionText}`);
                  }
                }
                break;
              }
              default: {
                console.log(`Unknown param type: ${itemType}`);
              }
            }
          }

          const answerEmbed = new SIGameEmbed();
          question.answer.push(answerEmbed);

          for (const ans of answer) {
            const type = XMLNormalizer.getAttribute(ans, 'type', 'text');
            const text = XMLNormalizer.getText(ans, '');

            if (type === 'text') {
              answerEmbed.text.push(text);
            } else {
              answerEmbed.files.push(text);
            }
          }
        }
      }
    }

    await Bun.write('temp/siq-normalized.json', JSON.stringify(pack, null, 2));

    return pack;
  }
}
