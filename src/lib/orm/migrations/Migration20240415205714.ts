import { Migration } from '@mikro-orm/migrations';

export class Migration20240415205714 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table "bot_events" alter column "message" type text using ("message"::text);');
    this.addSql('alter table "bot_events" alter column "attachment" type text using ("attachment"::text);');
  }

  async down(): Promise<void> {
    this.addSql('alter table "bot_events" alter column "message" type varchar(255) using ("message"::varchar(255));');
    this.addSql('alter table "bot_events" alter column "attachment" type varchar(255) using ("attachment"::varchar(255));');
  }

}
