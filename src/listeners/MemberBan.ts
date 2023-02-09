import { DirectusService } from '../lib/directus/services';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { Events, type GuildMember } from 'discord.js';
import { TemplateType } from '../lib/directus/directus-entities/Events';

@ApplyOptions<Listener.Options>({ event: Events.GuildBanAdd })
export class MemberBan extends Listener<typeof Events.GuildBanAdd> {
  async run(member: GuildMember) {
    const message = DirectusService.getRandomChatTemplate(
      TemplateType.MEMBER_BAN,
      {
        user: `[<@${member.user.id}>] **${member.user.username}**`,
      },
    );

    await this.container.mainChannel.send(message);
    this.container.logger.info(
      `${member.user.username} has banned from the server`,
    );
  }
}
