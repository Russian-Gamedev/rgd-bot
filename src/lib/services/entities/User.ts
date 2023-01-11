import { DirectusEntity } from '../Entity';

export class User extends DirectusEntity {
  static override get collection() {
    return 'user';
  }

  declare id: string;
  username: string;
  avatar: string;
  banner?: string;
  voiceTime = 0;
  reputation = 0;
  coins = 0;
  leaveCount = 0;
  firstJoin: string;
  about?: string;
  birthData?: string;
  experience = 0;
  invite?: string;
}
