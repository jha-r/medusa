import { model } from "@medusajs/framework/utils"
import PriceList from "./price-list"

// type OptionalFields = DAL.SoftDeletableModelDateColumns

// const tableName = "price_list_rule"
// const PriceListRuleDeletedAtIndex = createPsqlIndexStatementHelper({
//   tableName: tableName,
//   columns: "deleted_at",
//   where: "deleted_at IS NOT NULL",
// })

// const PriceListRulePriceListIdIndex = createPsqlIndexStatementHelper({
//   tableName: tableName,
//   columns: "price_list_id",
//   where: "deleted_at IS NULL",
// })

const PriceListRule = model
  .define("PriceListRule", {
    id: model.id({ prefix: "prule" }).primaryKey(),
    attribute: model.text(),
    value: model.json().nullable(),
    price_list: model.belongsTo(() => PriceList, {
      mappedBy: "price_list_rules",
    }),
  })
  .indexes([
    {
      on: ["price_list_id"],
      where: "deleted_at IS NULL",
    },
  ])

// @Entity({ tableName })
// @Filter(DALUtils.mikroOrmSoftDeletableFilterOptions)
// export default class PriceListRule {
// [OptionalProps]: OptionalFields
// @PrimaryKey({ columnType: "text" })
// id!: string
// @Property({ columnType: "text" })
// attribute: string
// @Property({ columnType: "jsonb", nullable: true })
// value: string | string[] | null = null
// @PriceListRulePriceListIdIndex.MikroORMIndex()
// @ManyToOne(() => PriceList, {
//   columnType: "text",
//   mapToPk: true,
//   fieldName: "price_list_id",
//   onDelete: "cascade",
// })
// price_list_id: string
// @ManyToOne(() => PriceList, { persist: false })
// price_list: Rel<PriceList>
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
// @PriceListRuleDeletedAtIndex.MikroORMIndex()
// @Property({ columnType: "timestamptz", nullable: true })
// deleted_at: Date | null = null
// @BeforeCreate()
// beforeCreate() {
//   this.id = generateEntityId(this.id, "plrule")
//   this.price_list_id ??= this.price_list?.id!
// }
// @OnInit()
// onInit() {
//   this.id = generateEntityId(this.id, "plrule")
//   this.price_list_id ??= this.price_list?.id!
// }
// }
export default PriceListRule
