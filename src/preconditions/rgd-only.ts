import { ApplyOptions } from '@sapphire/decorators';
import { AllFlowsPrecondition, PreconditionResult } from '@sapphire/framework';
import {
  ChatInputCommandInteraction,
  ContextMenuCommandInteraction,
  Message,
} from 'discord.js';

@ApplyOptions<AllFlowsPrecondition.Options>({ position: 20 })
export class RgdOnlyPrecondition extends AllFlowsPrecondition {
  messageRun(message: Message): PreconditionResult {
    return this.isRgd(message.guildId);
  }
  chatInputRun(interaction: ChatInputCommandInteraction): PreconditionResult {
    return this.isRgd(interaction.guildId);
  }
  contextMenuRun(
    interaction: ContextMenuCommandInteraction,
  ): PreconditionResult {
    return this.isRgd(interaction.guildId);
  }

  isRgd(guild_id: string) {
    if (process.env.RGD_ID === guild_id) {
      return this.ok();
    }
    return this.error();
  }
}
