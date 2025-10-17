import { Migration } from '@mikro-orm/migrations';

export class Migration20251017102155 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "users" alter column "invited_by" type varchar(255) using ("invited_by"::varchar(255));`);
    this.addSql(`alter table "users" alter column "invited_by" drop not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "users" alter column "invited_by" type varchar(255) using ("invited_by"::varchar(255));`);
    this.addSql(`alter table "users" alter column "invited_by" set not null;`);
  }

}
