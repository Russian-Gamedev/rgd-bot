export enum GuildSettings {
  AuditLogChannel = 'audit_log_channel',
  EventMessageChannel = 'event_message_channel',
  ActiveRoleId = 'active_role_id',
  ActiveAutoGiveRole = 'active_auto_role',
  ActiveAutoGiveRoleThreshold = 'active_auto_role_threshold',
  ActiveAutoRemoveRoleThreshold = 'active_auto_remove_role_threshold',
  ShizRoleId = 'shiz_role_id',
}

export const enum GuildEvents {
  MEMBER_FIRST_JOIN = 'member_first_join',
  MEMBER_JOIN = 'member_join',
  MEMBER_LEAVE = 'member_leave',
  MEMBER_BAN = 'member_ban',
  MEMBER_KICK = 'member_kick',
  MEMBER_SET_NAME = 'member_set_name',
}
