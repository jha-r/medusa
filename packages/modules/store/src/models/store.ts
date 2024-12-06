import { model } from "@medusajs/framework/utils"
import StoreCurrency from "./currency"

const Store = model
  .define("Store", {
    id: model.id({ prefix: "store" }).primaryKey(),
    name: model.text().default("Medusa Store").searchable(),
    default_sales_channel_id: model.text().nullable(),
    default_region_id: model.text().nullable(),
    default_location_id: model.text().nullable(),
    metadata: model.json().nullable(),
    supported_currencies: model.hasMany(() => StoreCurrency, {
      mappedBy: "store",
    }),
  })
  .cascades({
    delete: ["supported_currencies"],
  })

export default Store

// @Entity()
// @Filter(DALUtils.mikroOrmSoftDeletableFilterOptions)
// export default class Store {
// [OptionalProps]?: StoreOptionalProps

// @PrimaryKey({ columnType: "text" })
// id: string

// @Searchable()
// @Property({ columnType: "text", default: "Medusa Store" })
// name: string

// @OneToMany(() => StoreCurrency, (o) => o.store, {
//   cascade: [Cascade.PERSIST, "soft-remove"] as any,
// })
// supported_currencies = new Collection<StoreCurrency>(this)

// @Property({ columnType: "text", nullable: true })
// default_sales_channel_id: string | null = null

// @Property({ columnType: "text", nullable: true })
// default_region_id: string | null = null

// @Property({ columnType: "text", nullable: true })
// default_location_id: string | null = null

// @Property({ columnType: "jsonb", nullable: true })
// metadata: Record<string, unknown> | null = null

// @Property({
//   onCreate: () => new Date(),
//   columnType: "timestamptz",
//   defaultRaw: "now()",
// })
// created_at: Date

// @Property({
//   onCreate: () => new Date(),
//   onUpdate: () => new Date(),
//   columnType: "timestamptz",
//   defaultRaw: "now()",
// })
// updated_at: Date

// @StoreDeletedAtIndex.MikroORMIndex()
// @Property({ columnType: "timestamptz", nullable: true })
// deleted_at: Date | null = null

// @BeforeCreate()
// onCreate() {
//   this.id = generateEntityId(this.id, "store")
// }

// @OnInit()
// onInit() {
//   this.id = generateEntityId(this.id, "store")
// }
// }
