import { Injectable } from '@nestjs/common';
import { AutocompleteInteraction } from 'discord.js';
import { AutocompleteInterceptor, StringOption } from 'necord';

import { SIGameService } from './sigame.service';

export class SIGameSearchDTO {
  @StringOption({
    name: 'query',
    description: 'Поисковый запрос',
    required: true,
    autocomplete: true,
  })
  id: string;
}

@Injectable()
export class SIGamePackAutocompleteInterceptor extends AutocompleteInterceptor {
  constructor(private readonly sigameService: SIGameService) {
    super();
  }

  async transformOptions(interaction: AutocompleteInteraction) {
    const focused = interaction.options.getFocused(true);

    const choices: { value: string; name: string }[] = [];

    const calcSize = (bytes: number) => {
      const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
      if (bytes === 0) return '0 Byte';
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      return Math.round(bytes / Math.pow(1024, i)) + ' ' + sizes[i];
    };

    if (focused.name === 'query') {
      const packs = await this.sigameService.searchPacks(focused.value);
      for (const pack of packs.packages.slice(0, 10)) {
        choices.push({
          value: pack.id.toString(),
          name: `${pack.name} (${pack.downloadCount} загрузок, ${calcSize(pack.size)})`,
        });
      }
    }

    return interaction.respond(choices);
  }
}
