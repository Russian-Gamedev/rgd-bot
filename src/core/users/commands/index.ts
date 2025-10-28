import { CoinsCommand } from './coins';
import { RenameCommands } from './rename.command';
import { TopCommand } from './top.command';
import { UserCommands } from './user.command';

export const commands = [
  UserCommands,
  RenameCommands,
  TopCommand,
  CoinsCommand,
];
