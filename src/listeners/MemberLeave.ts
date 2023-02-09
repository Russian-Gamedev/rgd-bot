import { DirectusService } from '../lib/directus/services';
import { ApplyOptions } from '@sapphire/decorators';
import { Listener } from '@sapphire/framework';
import { ROLE_IDS } from '../configs/discord-constants';
import { Events, type GuildMember } from 'discord.js';
import { UserRoles } from '../lib/directus/directus-entities/Discord';
import { TemplateType } from '../lib/directus/directus-entities/Events';
import { User } from '../lib/directus/directus-entities/User';
import { FilterRule } from '../lib/directus/directus-orm/filters';

@ApplyOptions<Listener.Options>({ event: Events.GuildMemberRemove })
export class MemberLeave extends Listener<typeof Events.GuildMemberRemove> {
  async run(member: GuildMember) {
    const user = await User.findOne(member.user.id);
    if (user) {
      const userRoles = await UserRoles.find({
        limit: -1,
        filter: new FilterRule().EqualTo('user_id', member.user.id),
      });
      /// Delete if not exist in member
      for (const role of userRoles) {
        if (!member.roles.cache.has(role.Discord_Roles_id)) {
          await role.delete();
        }
      }
      /// Create if not exist in database
      for (const [, role] of member.roles.cache) {
        if (role.id === ROLE_IDS.default) continue;
        if (
          !userRoles.some((userRole) => userRole.Discord_Roles_id == role.id)
        ) {
          const userRole = UserRoles.create({
            user_id: member.user.id,
            Discord_Roles_id: role.id,
          });
          await userRole.save();
        }
      }
    }

    const banList = await member.guild.bans.fetch();

    if (banList.find((user) => user.user.id == member.user.id)) return;

    const message = DirectusService.getRandomChatTemplate(
      TemplateType.MEMBER_LEAVE,
      {
        user: `[<@${member.user.id}>] **${member.displayName}**`,
      },
    );

    await this.container.mainChannel.send(message);
    this.container.logger.info(
      `${member.user.username} has leaved from the server`,
    );
  }
}
