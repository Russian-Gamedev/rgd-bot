import { Migration } from '@mikro-orm/migrations';

export class Migration20251008112208 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "activities" ("id" uuid not null default uuidv7(), "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "guild_id" bigint not null, "user_id" bigint not null, "period" varchar(255) not null, "message" int not null default 0, "voice" int not null default 0, "reactions" int not null default 0, constraint "activities_pkey" primary key ("id"));`);
    this.addSql(`create index "activity_guild_user_period_idx" on "activities" ("guild_id");`);
    this.addSql(`create index "activity_guild_user_period_idx" on "activities" ("user_id");`);
    this.addSql(`create index "activity_guild_user_period_idx" on "activities" ("period");`);

    this.addSql(`create table "guilds" ("id" bigserial primary key, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "name" varchar(255) not null, "owner_id" bigint not null, "icon_url" varchar(255) null);`);

    this.addSql(`create table "guild_settings" ("id" serial primary key, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "guild_id" bigint not null, "key" varchar(255) not null, "value" jsonb not null);`);

    this.addSql(`create table "roles" ("id" serial primary key, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "guild_id" bigint not null, "role_id" bigint not null, "name" varchar(255) not null, "color" varchar(255) not null, "position" int not null);`);

    this.addSql(`create table "users" ("id" bigserial primary key, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now());`);
  }

}
