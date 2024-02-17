import { Migration } from '@mikro-orm/migrations';

export class Migration20240216124926 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "guilds" ("id" varchar(255) not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), constraint "guilds_pkey" primary key ("id"));');

    this.addSql('create table "users" ("id" varchar(255) not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "username" varchar(255) not null, constraint "users_pkey" primary key ("id"));');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "guilds" cascade;');

    this.addSql('drop table if exists "users" cascade;');
  }

}
