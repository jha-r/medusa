import { model } from "@medusajs/framework/utils"
import TaxRateRule from "./tax-rate-rule"
import TaxRegion from "./tax-region"

// type OptionalTaxRateProps = DAL.SoftDeletableModelDateColumns

// const TABLE_NAME = "tax_rate"

// export const singleDefaultRegionIndexName = "IDX_single_default_region"
// const singleDefaultRegionIndexStatement = createPsqlIndexStatementHelper({
//   name: singleDefaultRegionIndexName,
//   tableName: TABLE_NAME,
//   columns: "tax_region_id",
//   unique: true,
//   where: "is_default = true AND deleted_at IS NULL",
// })

// const taxRegionIdIndexName = "IDX_tax_rate_tax_region_id"
// const taxRegionIdIndexStatement = createPsqlIndexStatementHelper({
//   name: taxRegionIdIndexName,
//   tableName: TABLE_NAME,
//   columns: "tax_region_id",
//   where: "deleted_at IS NULL",
// })
// const deletedAtIndexStatement = createPsqlIndexStatementHelper({
//   tableName: TABLE_NAME,
//   columns: "deleted_at",
//   where: "deleted_at IS NOT NULL",
// })

const TaxRate = model
  .define("TaxRate", {
    id: model.id({ prefix: "txr" }).primaryKey(),
    rate: model.number().nullable(),
    code: model.text().searchable(),
    name: model.text().searchable(),
    is_default: model.boolean().default(false),
    is_combinable: model.boolean().default(false),
    tax_region: model.belongsTo(() => TaxRegion, {
      mappedBy: "tax_rates",
    }),
    rules: model.hasMany(() => TaxRateRule, {
      mappedBy: "tax_rate",
    }),
    metadata: model.json().nullable(),
    created_by: model.text().nullable(),
  })
  .indexes([
    {
      name: "IDX_tax_rate_tax_region_id",
      on: ["tax_region_id"],
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_single_default_region",
      on: ["tax_region_id"],
      unique: true,
      where: "is_default = true AND deleted_at IS NULL",
    },
  ])
  .cascades({
    delete: ["rules"],
  })

export default TaxRate

// @singleDefaultRegionIndexStatement.MikroORMIndex()
// @Entity({ tableName: TABLE_NAME })
// @Filter(DALUtils.mikroOrmSoftDeletableFilterOptions)
// export default class TaxRate {
// [OptionalProps]?: OptionalTaxRateProps
// @PrimaryKey({ columnType: "text" })
// id!: string
// @Property({ columnType: "real", nullable: true })
// rate: number | null = null
// @Searchable()
// @Property({ columnType: "text" })
// code: string
// @Searchable()
// @Property({ columnType: "text" })
// name: string
// @Property({ columnType: "bool", default: false })
// is_default: boolean = false
// @Property({ columnType: "bool", default: false })
// is_combinable: boolean = false
// @ManyToOne(() => TaxRegion, {
//   columnType: "text",
//   fieldName: "tax_region_id",
//   mapToPk: true,
//   onDelete: "cascade",
// })
// @taxRegionIdIndexStatement.MikroORMIndex()
// tax_region_id: string
// @ManyToOne({ entity: () => TaxRegion, persist: false })
// tax_region: Rel<TaxRegion>
// @OneToMany(() => TaxRateRule, (rule) => rule.tax_rate, {
//   cascade: ["soft-remove" as Cascade],
// })
// rules = new Collection<Rel<TaxRateRule>>(this)
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
// @Property({ columnType: "text", nullable: true })
// created_by: string | null = null
// @deletedAtIndexStatement.MikroORMIndex()
// @Property({ columnType: "timestamptz", nullable: true })
// deleted_at: Date | null = null
// @BeforeCreate()
// onCreate() {
//   this.id = generateEntityId(this.id, "txr")
// }
// @OnInit()
// onInit() {
//   this.id = generateEntityId(this.id, "txr")
// }
// }
