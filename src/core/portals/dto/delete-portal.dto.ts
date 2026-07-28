import { StringOption } from 'necord';

export class DeletePortalDto {
  @StringOption({
    name: 'id',
    description: 'Портал для удаления',
    required: true,
    autocomplete: true,
  })
  id: string;
}
