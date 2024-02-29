import { Migration } from '@mikro-orm/migrations';

export class Migration20240229184611 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "bot_events" ("id" serial primary key, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "type" varchar(255) not null, "message" varchar(255) not null, "attachment" varchar(255) null, "triggered_count" int not null default 0);');

    this.addSql('create table "guild_settings" ("id" serial primary key, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "key" varchar(255) not null, "value" varchar(255) not null);');

    this.addSql('create table "guild_invites" ("id" varchar(255) not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "alias" varchar(255) null, "uses" int not null default 0, "inviter" varchar(255) not null, constraint "guild_invites_pkey" primary key ("id"));');

    this.addSql('create table "guild_roles" ("id" serial primary key, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "role_id" varchar(255) not null, "name" varchar(255) not null, "color" varchar(255) not null, "position" int not null);');

    this.addSql('create table "stats" ("id" serial primary key, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "user_id" varchar(255) not null, "voice" int not null default 0, "chat" int not null default 0, "reactions" int not null default 0, "period" varchar(255) not null);');

    this.addSql('create table "user_roles" ("id" serial primary key, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "user_id" varchar(255) not null, "role_id" varchar(255) not null);');

    this.addSql('alter table "guilds" add column "name" varchar(255) not null, add column "owner_id" varchar(255) not null;');

    this.addSql('alter table "users" add column "reputation" int not null default 0;');
    this.addSql('alter table "users" alter column "id" type int using ("id"::int);');
    this.addSql('create sequence if not exists "users_id_seq";');
    this.addSql('select setval(\'users_id_seq\', (select max("id") from "users"));');
    this.addSql('alter table "users" alter column "id" set default nextval(\'users_id_seq\');');
    this.addSql('alter table "users" rename column "guild_id" to "user_id";');
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "bot_events" cascade;');

    this.addSql('drop table if exists "guild_settings" cascade;');

    this.addSql('drop table if exists "guild_invites" cascade;');

    this.addSql('drop table if exists "guild_roles" cascade;');

    this.addSql('drop table if exists "stats" cascade;');

    this.addSql('drop table if exists "user_roles" cascade;');

    this.addSql('alter table "guilds" drop column "name";');
    this.addSql('alter table "guilds" drop column "owner_id";');

    this.addSql('alter table "users" drop column "reputation";');

    this.addSql('alter table "users" alter column "id" type varchar(255) using ("id"::varchar(255));');
    this.addSql('alter table "users" alter column "id" drop default;');
    this.addSql('alter table "users" rename column "user_id" to "guild_id";');
  }

}
