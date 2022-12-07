import type { TemplateType } from '../../configs/templates';
import { TEMPLATES } from '../../configs/templates';

export function getRandomChatTemplate(
  type: TemplateType,
  params: { [name: string]: string },
) {
  const source = TEMPLATES[type];

  const names = Object.keys(params);
  const values = Object.values(params);

  const template = source[Math.floor(Math.random() * source.length)];
  console.log(template);
  let message: string = new Function(
    ...names,
    `return \`${template.message}\`;`,
  )(...values);

  if (template.attachment) message += '\n' + template.attachment;

  return message;
}
