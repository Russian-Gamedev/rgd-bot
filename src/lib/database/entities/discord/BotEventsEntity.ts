import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';

import { pickRandom } from '#lib/utils';

export enum TemplateType {
  MEMBER_FIRST_JOIN = 'member_first_join',
  MEMBER_JOIN = 'member_join',
  MEMBER_LEAVE = 'member_leave',
  MEMBER_BAN = 'member_ban',
  MEMBER_KICK = 'member_kick',
}

@Entity('Bot_Events')
export class BotEventsTemplates extends BaseEntity {
  @PrimaryColumn()
  id: number;

  @Column('varchar')
  type: TemplateType;

  @Column('varchar')
  message: string;

  @Column('text', { nullable: true })
  attachment: string;

  static async getRandom(type: TemplateType, params: Record<string, string>) {
    const events = await this.find({ where: { type } });

    const names = Object.keys(params);
    const values = Object.values(params);
    const template = pickRandom(events);

    let message: string = new Function(
      ...names,
      `return \`${template.message}\`;`,
    )(...values);

    const attachments = template.attachment?.split(',') ?? [];

    if (attachments.length) {
      message += '\n' + pickRandom(attachments).trim();
    }

    return message;
  }
}
