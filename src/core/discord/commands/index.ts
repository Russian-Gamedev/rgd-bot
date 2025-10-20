import { PingCommand } from './utils/ping.command';
import { PruneCommand } from './utils/prune.command';
import { UserUtilsCommand } from './utils/user.command';

export const commands = [PingCommand, UserUtilsCommand, PruneCommand];
