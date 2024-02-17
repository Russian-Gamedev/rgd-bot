import { Precondition } from '@sapphire/framework';
import {
  CommandInteraction,
  ContextMenuCommandInteraction,
  Message,
} from 'discord.js';

import { OWNER_ID } from '#config/constants';

declare module '@sapphire/framework' {
  interface Preconditions {
    OwnerOnly: never;
  }
}

export class OwnerOnlyPrecondition extends Precondition {
  public override async messageRun(message: Message) {
    return this.checkOwner(message.author.id);
  }

  public override async chatInputRun(interaction: CommandInteraction) {
    return this.checkOwner(interaction.user.id);
  }

  public override async contextMenuRun(
    interaction: ContextMenuCommandInteraction,
  ) {
    return this.checkOwner(interaction.user.id);
  }
  async checkOwner(userId: string) {
    return OWNER_ID.includes(userId)
      ? this.ok()
      : this.error({ message: 'Only the bot owner can use this command!' });
  }
}
