import type { TemplateType } from '../../configs/templates';
import { TEMPLATES } from '../../configs/templates';

export function getChatTemplate(
  type: TemplateType,
  params: { [name: string]: string },
) {
  const source = TEMPLATES[type];

  const names = Object.keys(params);
  const values = Object.values(params);

  const template = source[Math.floor(Math.random() * source.length)];

  return new Function(...names, `return \`${template}\`;`)(...values);
}
