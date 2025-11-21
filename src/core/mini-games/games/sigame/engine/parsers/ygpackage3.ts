import { XMLParser } from 'fast-xml-parser';

import {
  SIGameEmbed,
  SIGamePack,
  SIGameQuestion,
  SIGameRound,
  SIGameTheme,
} from '../sigame.pack';
import { XMLNormalizer } from '../utils';

import { SIGamePackParser } from '.';

export class SIGameParseYGPackage3 extends SIGamePackParser {
  canParse(content: string): boolean {
    return content.includes('ygpackage3.0.xsd');
  }

  async parse(content: string) {
    const pack = new SIGamePack();

    const xml = new XMLParser({
      ignoreAttributes: false,
      alwaysCreateTextNode: true,
    }).parse(content);

    await Bun.write(
      'temp/ygpackage3-parsed.json',
      JSON.stringify(xml, null, 2),
    );

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
          if (!questionXml) continue;
          const question = new SIGameQuestion();
          question.price = Number(
            XMLNormalizer.getAttribute(questionXml, 'price', '0'),
          );
          theme.questions.push(question);
          const atoms = XMLNormalizer.toArray(questionXml.scenario.atom);
          const answer = XMLNormalizer.toArray(questionXml.right.answer);

          const markerIndex = atoms.findIndex((atom) => {
            const type = XMLNormalizer.getAttribute(atom, 'type', 'text');
            return type === 'marker';
          });

          const atomEmbed = new SIGameEmbed();

          question.question.push(atomEmbed);

          for (const atom of atoms) {
            const ind = atoms.indexOf(atom);
            const type = XMLNormalizer.getAttribute(atom, 'type', 'text');
            const text = XMLNormalizer.getText(atom, '');

            if (type === 'marker') {
              continue;
            }

            if (ind > markerIndex && markerIndex !== -1) {
              answer.push(atom);
              continue;
            }

            if (type === 'text') {
              atomEmbed.text.push(text);
            } else {
              atomEmbed.files.push(text);
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

    await Bun.write(
      'temp/ygpackage3-normalized.json',
      JSON.stringify(pack, null, 2),
    );

    return pack;
  }
}
