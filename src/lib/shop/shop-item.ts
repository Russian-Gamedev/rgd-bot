import { Awaitable, Piece } from '@sapphire/framework';
import { SlashCommandSubcommandBuilder } from 'discord.js';

export abstract class ShopItem extends Piece {
  readonly cost: number;
  readonly description: string;

  public constructor(context: Piece.Context, options: ShopItemOptions) {
    super(context, options);
    Object.assign(this, options);
  }

  public abstract commandBuilder(
    subcommandGroup: SlashCommandSubcommandBuilder,
  ): SlashCommandSubcommandBuilder;

  public abstract run(payload: unknown): Awaitable<unknown>;
}

export interface ShopItemOptions extends Piece.Options {
  cost: number;
  name: string;
  description: string;
}

export namespace ShopItem {
  export type Options = ShopItemOptions;
}
