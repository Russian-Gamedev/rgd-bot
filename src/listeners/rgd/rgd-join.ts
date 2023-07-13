import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { container } from '@sapphire/pieces';

import {
  BotEventsTemplates,
  TemplateType,
  User,
} from '@/lib/database/entities/';
import { RgdEvents } from '@/lib/discord/custom-events';

@ApplyOptions<Listener.Options>({ event: RgdEvents.MemberJoin })
export class RgdJoin extends Listener {
  async run(user: User) {
    let message = await BotEventsTemplates.getRandom(TemplateType.MEMBER_JOIN, {
      user: `<@${user.id}>`,
    });
    message += `|| ${user.leaveCount} раз ||`;

    await container.mainChannel.send(message);
  }
}
