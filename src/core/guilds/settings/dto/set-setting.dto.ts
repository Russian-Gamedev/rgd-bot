import { StringOption } from 'necord';

import { GuildSettings } from '#config/guilds';

export class SetSettingDto<T> {
  @StringOption({
    name: 'key',
    description: 'The setting key to set',
    required: true,
    choices: Object.values(GuildSettings).map((value) => ({
      name: value,
      value,
    })),
  })
  key: string;

  @StringOption({
    name: 'value',
    description: 'The setting value to set',
    required: true,
  })
  value: T;
}
