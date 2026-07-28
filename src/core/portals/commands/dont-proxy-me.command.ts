import { Injectable } from '@nestjs/common';
import { InteractionContextType, MessageFlags } from 'discord.js';
import { Context, SlashCommand, type SlashCommandContext } from 'necord';

import { PortalsService } from '../portals.service';

@Injectable()
export class DontProxyMeCommand {
  constructor(private readonly portalsService: PortalsService) {}

  @SlashCommand({
    name: 'portal-dont-proxy-me',
    description: 'Заблокировать или разблокировать себя в порталах',
    contexts: [InteractionContextType.Guild],
  })
  public async onToggle(@Context() [interaction]: SlashCommandContext) {
    const userId = BigInt(interaction.user.id);
    const isBlocked = await this.portalsService.isBlacklisted(userId);

    if (isBlocked) {
      await this.portalsService.removeFromBlacklist(userId);
      await interaction.reply({
        content: 'Ваши сообщения снова пересылаются через порталы.',
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await this.portalsService.addToBlacklist(userId);
      await interaction.reply({
        content:
          'Ваши сообщения больше не будут пересылаться через порталы. Чтобы снова включить — используйте эту же команду.',
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
