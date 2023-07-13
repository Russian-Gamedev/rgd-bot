import { container } from '@sapphire/pieces';
import { ChatInputCommandInteraction } from 'discord.js';

import { replyWithError } from '@/lib/helpers/sapphire';

type Interaction = ChatInputCommandInteraction;

type InteractionHandler = (interaction: Interaction) => Promise<any>;

export function HasRole(role_id: string) {
  return function (
    target: object,
    _propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<InteractionHandler>,
  ) {
    const handler = descriptor.value;

    descriptor.value = async (interaction) => {
      const member = await container.rgd.members.fetch(interaction.user.id);
      if (!member.roles.cache.has(role_id)) {
        return replyWithError(interaction, `У вас нет роли <@&${role_id}>`);
      }
      return handler.call(target, interaction);
    };
  };
}
