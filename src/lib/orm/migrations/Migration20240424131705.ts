import { Migration } from '@mikro-orm/migrations';

export class Migration20240424131705 extends Migration {

  async up(): Promise<void> {
    this.addSql('create index "bot_events_guild_id_type_index" on "bot_events" ("guild_id", "type");');

    this.addSql('create index "guild_settings_guild_id_key_index" on "guild_settings" ("guild_id", "key");');

    this.addSql('create index "guild_invites_guild_id_index" on "guild_invites" ("guild_id");');

    this.addSql('create index "emoji_weight_guild_id_emoji_index" on "emoji_weight" ("guild_id", "emoji");');

    this.addSql('create index "guild_roles_guild_id_role_id_index" on "guild_roles" ("guild_id", "role_id");');

    this.addSql('create index "role_reactions_guild_id_role_id_index" on "role_reactions" ("guild_id", "role_id");');

    this.addSql('create index "stats_guild_id_user_id_index" on "stats" ("guild_id", "user_id");');

    this.addSql('create index "users_guild_id_user_id_index" on "users" ("guild_id", "user_id");');

    this.addSql('create index "user_roles_guild_id_user_id_index" on "user_roles" ("guild_id", "user_id");');
  }

  async down(): Promise<void> {
    this.addSql('drop index "bot_events_guild_id_type_index";');

    this.addSql('drop index "guild_settings_guild_id_key_index";');

    this.addSql('drop index "guild_invites_guild_id_index";');

    this.addSql('drop index "emoji_weight_guild_id_emoji_index";');

    this.addSql('drop index "guild_roles_guild_id_role_id_index";');

    this.addSql('drop index "role_reactions_guild_id_role_id_index";');

    this.addSql('drop index "stats_guild_id_user_id_index";');

    this.addSql('drop index "users_guild_id_user_id_index";');

    this.addSql('drop index "user_roles_guild_id_user_id_index";');
  }

}
