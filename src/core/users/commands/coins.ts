import { Injectable } from '@nestjs/common';
import { MessageFlags } from 'discord.js';
import {
  Context,
  createCommandGroupDecorator,
  Options,
  type SlashCommandContext,
  Subcommand,
} from 'necord';

import { CoinTransferDto } from '../dto/coins.dto';
import { UserService } from '../users.service';

const CoinsGroupDecorator = createCommandGroupDecorator({
  name: 'coins',
  description: 'Центробанк РГД',
});

@CoinsGroupDecorator()
@Injectable()
export class CoinsCommand {
  constructor(private readonly userService: UserService) {}

  @Subcommand({
    name: 'transfer',
    description: 'Перевести монеты другому пользователю',
  })
  async transfer(
    @Context() [interaction]: SlashCommandContext,
    @Options() dto: CoinTransferDto,
  ) {
    if (!interaction.guild) return;

    const fromUser = await this.userService.findOrCreate(
      interaction.guild.id,
      interaction.user.id,
    );
    const toUser = await this.userService.findOrCreate(
      interaction.guild.id,
      dto.target.id,
    );
    const amount = Math.floor(Number(dto.amount));

    if (amount <= 0) {
      return interaction.reply({
        content: 'Сумма перевода должна быть положительным числом.',
        flags: MessageFlags.Ephemeral,
      });
    }

    if (fromUser.coins < amount) {
      return interaction.reply({
        content: 'У вас недостаточно монет для этого перевода.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await this.userService.transferCoins(fromUser, toUser, amount);

    return interaction.reply({
      content: `<@${interaction.user.id}> перевел ${amount.toLocaleString('ru-RU')} монет пользователю <@${dto.target.user.id}>.`,
    });
  }
}
