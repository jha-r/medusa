import { Migration } from '@mikro-orm/migrations';

export class Migration20241125130058 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table if exists "cart_line_item" add column if not exists "is_custom_price" boolean null;');
    this.addSql('update "cart_line_item" set "is_custom_price" = false where "is_custom_price" is null;');
    this.addSql('alter table if exists "cart_line_item" alter column "is_custom_price" set not null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "cart_line_item" drop column if exists "is_custom_price";');
  }

}
