import { StringOption } from 'necord';

export class LinkCodeDto {
  @StringOption({
    name: 'code',
    description: 'Код привязки из телеграм бота',
    required: true,
  })
  code: string;
}
