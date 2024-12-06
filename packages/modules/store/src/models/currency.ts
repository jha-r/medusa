import { model } from "@medusajs/framework/utils"
import Store from "./store"

const StoreCurrency = model.define("StoreCurrency", {
  id: model.id({ prefix: "stocur" }).primaryKey(),
  currency_code: model.text().searchable(),
  is_default: model.boolean().default(false),
  store: model
    .belongsTo(() => Store, {
      mappedBy: "supported_currencies",
    })
    .nullable(),
})

export default StoreCurrency

// @Entity()
// @Filter(DALUtils.mikroOrmSoftDeletableFilterOptions)
// export default class StoreCurrency {
// @PrimaryKey({ columnType: "text" })
// id: string
// @Searchable()
// @Property({ columnType: "text" })
// currency_code: string
// @Property({ columnType: "boolean", default: false })
// is_default?: boolean
// @ManyToOne(() => Store, {
//   columnType: "text",
//   fieldName: "store_id",
//   mapToPk: true,
//   nullable: true,
//   onDelete: "cascade",
// })
// store_id: string | null
// @ManyToOne(() => Store, {
//   persist: false,
//   nullable: true,
// })
// store: Store | null
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
// @StoreCurrencyDeletedAtIndex.MikroORMIndex()
// @Property({ columnType: "timestamptz", nullable: true })
// deleted_at: Date | null = null
// @BeforeCreate()
// onCreate() {
//   this.id = generateEntityId(this.id, "stocur")
// }
// @OnInit()
// onInit() {
//   this.id = generateEntityId(this.id, "stocur")
// }
// }
