import { container } from '@sapphire/pieces';
import {
  Invites,
  DiscordChannel,
  DiscordRole,
  RoleBindings,
} from './directus-entities/Discord';
import {
  DiscordEvents,
  TemplateEvent,
  TemplateType,
} from './directus-entities/Events';

export class DirectusService {
  static async updateFull() {
    await Promise.allSettled([
      await DirectusService.updateInvites(),
      await DirectusService.updateChannels(),
      await DirectusService.updateRoles(),
      await DirectusService.updateTemplates(),
      await DirectusService.updateRoles(),
      await DirectusService.updateRolesBindings(),
    ]);
  }

  static async updateInvites() {
    const invites = await container.rgd.invites.fetch();

    const promises = invites.map(async (invite) => {
      if (invite.inviter.bot) return;
      try {
        let directusInvite = await Invites.findOne(invite.code);

        if (!directusInvite) {
          directusInvite = Invites.create({
            id: invite.code,
            inviter: invite.inviterId,
          });
        }

        directusInvite.uses = invite.uses;
        await directusInvite.save();
      } catch (e) {}
    });

    await Promise.all(promises);

    container.logger.info(`${invites.size} invites updated`);

    return invites.size;
  }

  static async updateChannels() {
    const channels = await container.rgd.channels.fetch();

    const promises = channels.map(async (channel) => {
      let directusChannel = await DiscordChannel.findOne(channel.id);
      if (!directusChannel) {
        directusChannel = await DiscordChannel.create({ id: channel.id });
      }
      directusChannel.name = channel.name;
      directusChannel.isVoice = channel.isVoiceBased();
      directusChannel.position = channel.position;

      await directusChannel.save();
    });

    await Promise.all(promises);

    container.logger.info(`${channels.size} channels updated`);
    return channels.size;
  }

  static async updateRoles() {
    const roles = await container.rgd.roles.fetch();

    const promises = roles.map(async (role) => {
      let existRole = await DiscordRole.findOne(role.id);
      if (!existRole) {
        existRole = await DiscordRole.create({ id: role.id });
      }
      existRole.color = role.hexColor;
      existRole.name = role.name;
      existRole.position = role.position;
      await existRole.save();
    });

    await Promise.all(promises);

    container.logger.info(`${roles.size} roles updated`);
    return roles.size;
  }

  private static templates: Record<TemplateType, TemplateEvent[]>;
  static async updateTemplates() {
    const data = await DiscordEvents.find({ limit: -1 });

    this.templates = {
      [TemplateType.MEMBER_FIRST_JOIN]: [],
      [TemplateType.MEMBER_JOIN]: [],
      [TemplateType.MEMBER_LEAVE]: [],
      [TemplateType.MEMBER_BAN]: [],
      [TemplateType.MEMBER_KICK]: [],
    };

    for (const event of data) {
      this.templates[event.type].push({
        message: event.message,
        attachment: event.attachment,
      });
    }

    container.logger.info(`${data.length} bots event updated`);

    return data.length;
  }

  static getRandomChatTemplate(
    type: TemplateType,
    params: Record<string, string>,
  ) {
    const source = this.templates[type];

    const names = Object.keys(params);
    const values = Object.values(params);

    const template = source[Math.floor(Math.random() * source.length)];
    let message: string = new Function(
      ...names,
      `return \`${template.message}\`;`,
    )(...values);

    if (template.attachment) message += '\n' + template.attachment;

    return message;
  }

  static async updateRolesBindings() {
    const list = await RoleBindings.find({ limit: -1 });
    if (list) {
      RoleBindings.list = list;
    }
  }
}
