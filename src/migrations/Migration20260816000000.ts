import { Migration } from '@mikro-orm/migrations';

export class Migration20260816000000 extends Migration {
  override up(): void | Promise<void> {
    this.addSql(
      `alter table "wallet_transactions" alter column "guild_id" drop not null;`,
    );
  }

  override down(): void | Promise<void> {
    this.addSql(
      `alter table "wallet_transactions" alter column "guild_id" set not null;`,
    );
  }
}
