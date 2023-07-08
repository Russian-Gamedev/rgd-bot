import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { container } from '@sapphire/pieces';

import { User } from '@/lib/database/entities';
import {
  BotEventsTemplates,
  TemplateType,
} from '@/lib/database/entities/BotEventsEntity';
import { RgdEvents } from '@/lib/discord/custom-events';

@ApplyOptions<Listener.Options>({ event: RgdEvents.MemberJoin })
export class MemberJoin extends Listener {
  async run(user: User) {
    const message = await BotEventsTemplates.getRandom(
      TemplateType.MEMBER_JOIN,
      {
        user: `<@${user.id}>`,
      },
    );

    console.log(message);
    await container.mainChannel?.send(message);
  }
}
