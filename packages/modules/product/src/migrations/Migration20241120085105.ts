import { Migration } from '@mikro-orm/migrations';

export class Migration20241120085105 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table if exists "product_images" add column if not exists "id" text not null;');
    this.addSql('alter table if exists "product_images" drop constraint if exists "product_images_pkey";');
    this.addSql('alter table if exists "product_images" add constraint "product_images_pkey" primary key ("id");');
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "product_images" drop constraint if exists "product_images_pkey";');
    this.addSql('alter table if exists "product_images" drop column if exists "id";');
    this.addSql('alter table if exists "product_images" add constraint "product_images_pkey" primary key ("product_id", "image_id");');
  }

}
