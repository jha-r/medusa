import { Migration } from "@mikro-orm/migrations"

export class Migration20241212094755 extends Migration {
  async up(): Promise<void> {
    this.addSql('drop index if exists "IDX_inventory_item_sku_unique";')
    this.addSql(
      'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_inventory_item_sku" ON "inventory_item" (sku) WHERE deleted_at IS NULL;'
    )
  }

  async down(): Promise<void> {
    this.addSql('drop index if exists "IDX_inventory_item_sku";')
    this.addSql(
      'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_inventory_item_sku_unique" ON "inventory_item" (sku);'
    )
  }
}
