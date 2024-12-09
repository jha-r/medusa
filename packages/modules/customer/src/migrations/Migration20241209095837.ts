import { Migration } from "@mikro-orm/migrations"

export class Migration20241209095837 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      'alter table if exists "customer_group_customer" drop constraint if exists "customer_group_customer_customer_id_foreign";'
    )
    this.addSql(
      'alter table if exists "customer_group_customer" drop constraint if exists "customer_group_customer_customer_group_id_foreign";'
    )

    this.addSql(
      'alter table if exists "customer_group_customer" add constraint "customer_group_customer_customer_id_foreign" foreign key ("customer_id") references "customer" ("id") on update cascade on delete cascade;'
    )
    this.addSql(
      'alter table if exists "customer_group_customer" add constraint "customer_group_customer_customer_group_id_foreign" foreign key ("customer_group_id") references "customer_group" ("id") on update cascade on delete cascade;'
    )
  }

  async down(): Promise<void> {
    this.addSql(
      'alter table if exists "customer_group_customer" drop constraint if exists "customer_group_customer_customer_id_foreign";'
    )
    this.addSql(
      'alter table if exists "customer_group_customer" drop constraint if exists "customer_group_customer_customer_group_id_foreign";'
    )

    this.addSql(
      'alter table if exists "customer_group_customer" add constraint "customer_group_customer_customer_id_foreign" foreign key ("customer_id") references "customer" ("id") on update cascade;'
    )
    this.addSql(
      'alter table if exists "customer_group_customer" add constraint "customer_group_customer_customer_group_id_foreign" foreign key ("customer_group_id") references "customer_group" ("id") on update cascade;'
    )
  }
}
