import { ChatInputCommand, Command, Piece } from '@sapphire/framework';

export abstract class BaseCommand extends Command {
  constructor(context: Piece.Context, options: ChatInputCommand.Options) {
    super(context, options);
  }
}
