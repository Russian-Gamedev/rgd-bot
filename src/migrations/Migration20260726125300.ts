import { Migration } from '@mikro-orm/migrations';

export class Migration20260726125300 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "guild_users" add column if not exists "last_active_at" timestamptz null;`,
    );
    this.addSql(
      `alter table "user_activity_totals" drop column if exists "last_active_at";`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "user_activity_totals" add column if not exists "last_active_at" timestamptz null;`,
    );
    this.addSql(
      `alter table "guild_users" drop column if exists "last_active_at";`,
    );
  }
}
