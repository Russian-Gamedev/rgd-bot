import { Migration } from '@mikro-orm/migrations';

export class Migration20240412210348 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "bot_events" ("id" serial primary key, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "guild_id" varchar(255) not null, "type" varchar(255) not null, "message" varchar(255) not null, "attachment" varchar(255) null, "triggered_count" int not null default 0);');

    this.addSql('create table "guilds" ("id" varchar(255) not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "name" varchar(255) not null, "owner_id" varchar(255) not null, constraint "guilds_pkey" primary key ("id"));');

    this.addSql('create table "guild_settings" ("id" serial primary key, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "guild_id" varchar(255) not null, "key" varchar(255) not null, "value" varchar(255) not null);');

    this.addSql('create table "guild_invites" ("id" varchar(255) not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "guild_id" varchar(255) not null, "alias" varchar(255) null, "uses" int not null default 0, "inviter" varchar(255) not null, constraint "guild_invites_pkey" primary key ("id"));');

    this.addSql('create table "emoji_weight" ("id" serial primary key, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "guild_id" varchar(255) not null, "emoji" varchar(255) not null, "weight" int not null);');

    this.addSql('create table "guild_roles" ("id" serial primary key, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "guild_id" varchar(255) not null, "role_id" varchar(255) not null, "name" varchar(255) not null, "color" varchar(255) not null, "position" int not null);');

    this.addSql('create table "role_reactions" ("id" serial primary key, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "guild_id" varchar(255) not null, "role_id" varchar(255) not null, "message_id" varchar(255) not null, "channel_id" varchar(255) not null, "emoji" varchar(255) not null);');

    this.addSql('create table "stats" ("id" serial primary key, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "guild_id" varchar(255) not null, "user_id" varchar(255) not null, "voice" int not null default 0, "chat" int not null default 0, "reactions" int not null default 0, "period" varchar(255) not null);');

    this.addSql('create table "users" ("id" serial primary key, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "guild_id" varchar(255) not null, "user_id" varchar(255) not null, "username" varchar(255) not null, "avatar" varchar(255) not null, "banner" varchar(255) null, "banner_alt" varchar(255) null, "banner_color" varchar(255) not null default \'#fff\', "first_join" timestamptz not null default now(), "about" varchar(255) null, "invite" varchar(255) null, "left_guild" boolean not null default false, "experience" int not null default 0, "coins" int not null default 0, "leave_count" int not null default 0, "voice_time" int not null default 0, "birth_date" varchar(255) null, "reputation" int not null default 0);');

    this.addSql('create table "user_roles" ("id" serial primary key, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "guild_id" varchar(255) not null, "user_id" varchar(255) not null, "role_id" varchar(255) not null);');
  }

}
