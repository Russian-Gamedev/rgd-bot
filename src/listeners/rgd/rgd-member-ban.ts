import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { container } from '@sapphire/pieces';

import {
  BotEventsTemplates,
  TemplateType,
  User,
} from '@/lib/database/entities';
import { RgdEvents } from '@/lib/discord/custom-events';

@ApplyOptions<Listener.Options>({ event: RgdEvents.MemberBan })
export class RgdMemberBan extends Listener {
  async run(user: User) {
    const message = await BotEventsTemplates.getRandom(
      TemplateType.MEMBER_BAN,
      {
        user: `<@${user.id}>`,
      },
    );

    await container.mainChannel.send(message);
  }
}
