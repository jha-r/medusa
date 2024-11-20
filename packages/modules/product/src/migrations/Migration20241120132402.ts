import { Migration } from '@mikro-orm/migrations';

export class Migration20241120132402 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table if exists "image" drop constraint if exists "image_product_id_foreign";');

    this.addSql('alter table if exists "image" alter column "product_id" type text using ("product_id"::text);');
    this.addSql('alter table if exists "image" alter column "product_id" drop not null;');
    this.addSql('alter table if exists "image" add constraint "image_product_id_foreign" foreign key ("product_id") references "product" ("id") on update cascade on delete cascade;');
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "image" drop constraint if exists "image_product_id_foreign";');

    this.addSql('alter table if exists "image" alter column "product_id" type text using ("product_id"::text);');
    this.addSql('alter table if exists "image" alter column "product_id" set not null;');
    this.addSql('alter table if exists "image" add constraint "image_product_id_foreign" foreign key ("product_id") references "product" ("id") on update cascade;');
  }

}
