import { DirectusEntity } from '../Entity';

export class DiscordRole extends DirectusEntity {
  static override collection = 'Discord_Roles';
  declare id: string;
  name: string;
  color: string;
  position: number;
}

export class DiscordChannel extends DirectusEntity {
  static override collection = 'Channels';
  declare id: string;
  name: string;
  isVoice: boolean;
  position: number;
}

export class RoleBindings extends DirectusEntity {
  static list: RoleBindings[] = [];
  static override collection = 'Role_Bindings';
  role: string;
  emoji: string;
  message: string;
}
