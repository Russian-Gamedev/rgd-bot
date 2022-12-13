import type { TemplateType } from '../../../configs/templates';
import { DirectusEntity } from './../Entity';

export class DiscordEvents extends DirectusEntity {
  static override collection = 'Bot_Events';

  declare id: number;
  type: `${TemplateType}`;
  message: string;
  attachment: string | null;
}
