export interface AuthProfile {
  user_id: string;
  guild_id: string;
  username: string;
  avatarUrl: string;
}

export interface JwtPayload {
  user_id: string;
  guild_id: string;
  username: string;
}
