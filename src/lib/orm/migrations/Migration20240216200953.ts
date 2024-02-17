import { Migration } from '@mikro-orm/migrations';

export class Migration20240216200953 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "users" add column "guild_id" varchar(255) not null, add column "avatar" varchar(255) not null, add column "banner" varchar(255) null, add column "banner_alt" varchar(255) null, add column "banner_color" varchar(255) not null default \'#fff\', add column "first_join" timestamptz not null default now(), add column "about" varchar(255) null, add column "invite" varchar(255) null, add column "left_guild" boolean not null default false, add column "experience" int not null default 0, add column "coins" int not null default 0, add column "leave_count" int not null default 0, add column "voice_time" int not null default 0, add column "birth_date" varchar(255) null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table "users" drop column "guild_id";');
    this.addSql('alter table "users" drop column "avatar";');
    this.addSql('alter table "users" drop column "banner";');
    this.addSql('alter table "users" drop column "banner_alt";');
    this.addSql('alter table "users" drop column "banner_color";');
    this.addSql('alter table "users" drop column "first_join";');
    this.addSql('alter table "users" drop column "about";');
    this.addSql('alter table "users" drop column "invite";');
    this.addSql('alter table "users" drop column "left_guild";');
    this.addSql('alter table "users" drop column "experience";');
    this.addSql('alter table "users" drop column "coins";');
    this.addSql('alter table "users" drop column "leave_count";');
    this.addSql('alter table "users" drop column "voice_time";');
    this.addSql('alter table "users" drop column "birth_date";');
  }

}
