import { DirectusEntity } from '../directus-orm/entity';

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

export class UserRoles extends DirectusEntity {
  static override collection = 'user_Discord_Roles';
  user_id: string;
  Discord_Roles_id: string;
}

export class Invites extends DirectusEntity {
  static override collection = 'Invites';
  declare id: string;
  uses = 0;
  alias: string;
  inviter: string;
}
