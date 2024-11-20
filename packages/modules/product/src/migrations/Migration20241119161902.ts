import { Migration } from '@mikro-orm/migrations';

export class Migration20241119161902 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table if exists "product_images" drop constraint if exists "product_images_product_id_foreign";');
    this.addSql('alter table if exists "product_images" drop constraint if exists "product_images_image_id_foreign";');

    this.addSql('alter table if exists "product_images" add column if not exists "rank" integer not null default 0;');
    this.addSql('alter table if exists "product_images" add constraint "product_images_product_id_foreign" foreign key ("product_id") references "product" ("id") on update cascade;');
    this.addSql('alter table if exists "product_images" add constraint "product_images_image_id_foreign" foreign key ("image_id") references "image" ("id") on update cascade;');
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "product_images" drop constraint if exists "product_images_product_id_foreign";');
    this.addSql('alter table if exists "product_images" drop constraint if exists "product_images_image_id_foreign";');

    this.addSql('alter table if exists "product_images" drop column if exists "rank";');
    this.addSql('alter table if exists "product_images" add constraint "product_images_product_id_foreign" foreign key ("product_id") references "product" ("id") on update cascade on delete cascade;');
    this.addSql('alter table if exists "product_images" add constraint "product_images_image_id_foreign" foreign key ("image_id") references "image" ("id") on update cascade on delete cascade;');
  }

}
