import { Migration } from '@mikro-orm/migrations';

export class Migration20241120125831 extends Migration {

  async up(): Promise<void> {
    this.addSql('drop table if exists "product_images" cascade;');

    this.addSql('alter table if exists "image" add column if not exists "rank" integer not null default 0, add column if not exists "product_id" text not null;');
    this.addSql('alter table if exists "image" add constraint "image_product_id_foreign" foreign key ("product_id") references "product" ("id") on update cascade;');
  }

  async down(): Promise<void> {
    this.addSql('create table if not exists "product_images" ("product_id" text not null, "image_id" text not null, constraint "product_images_pkey" primary key ("product_id", "image_id"));');

    this.addSql('alter table if exists "product_images" add constraint "product_images_product_id_foreign" foreign key ("product_id") references "product" ("id") on update cascade on delete cascade;');
    this.addSql('alter table if exists "product_images" add constraint "product_images_image_id_foreign" foreign key ("image_id") references "image" ("id") on update cascade on delete cascade;');

    this.addSql('alter table if exists "image" drop constraint if exists "image_product_id_foreign";');

    this.addSql('alter table if exists "image" drop column if exists "rank";');
    this.addSql('alter table if exists "image" drop column if exists "product_id";');
  }

}
