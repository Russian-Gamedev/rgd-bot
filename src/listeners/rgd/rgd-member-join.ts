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
export class RgdMemberJoin extends Listener {
  async run(user: User) {
    let message = await BotEventsTemplates.getRandom(TemplateType.MEMBER_JOIN, {
      user: `<@${user.id}>`,
    });
    message += `|| ${user.leaveCount} раз ||`;

    await container.mainChannel.send(message);
  }
}
