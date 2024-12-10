import { model } from "@medusajs/framework/utils"
import TaxProvider from "./tax-provider"
import TaxRate from "./tax-rate"

// export const countryCodeNullProvinceIndexName =
//   "IDX_tax_region_unique_country_nullable_province"
// export const countryCodeProvinceIndexName =
//   "IDX_tax_region_unique_country_province"
// const countryCodeProvinceIndexStatement = createPsqlIndexStatementHelper({
//   name: countryCodeProvinceIndexName,
//   tableName: TABLE_NAME,
//   columns: ["country_code", "province_code"],
//   unique: true,
//   where: "deleted_at IS NULL",
// })
// const deletedAtIndexStatement = createPsqlIndexStatementHelper({
//   tableName: TABLE_NAME,
//   columns: "deleted_at",
//   where: "deleted_at IS NOT NULL",
// })

// const countryCodeNullableProvinceIndexStatement =
//   createPsqlIndexStatementHelper({
//     name: "IDX_tax_region_unique_country_nullable_province",
//     tableName: TABLE_NAME,
//     columns: ["country_code"],
//     unique: true,
//     where: "province_code IS NULL AND deleted_at IS NULL",
//   })

export const taxRegionProviderTopLevelCheckName =
  "CK_tax_region_provider_top_level"
export const taxRegionCountryTopLevelCheckName =
  "CK_tax_region_country_top_level"

const TaxRegion = model
  .define("TaxRegion", {
    id: model.id({ prefix: "txreg" }).primaryKey(),
    country_code: model.text().searchable(),
    province_code: model.text().searchable().nullable(),
    metadata: model.json().nullable(),
    created_by: model.text().nullable(),
    provider: model
      .belongsTo(() => TaxProvider, {
        mappedBy: "regions",
      })
      .nullable(),
    parent: model
      .belongsTo(() => TaxRegion, {
        mappedBy: "children",
      })
      .nullable(),
    children: model.hasMany(() => TaxRegion, {
      mappedBy: "parent",
    }),
    tax_rates: model.hasMany(() => TaxRate, {
      mappedBy: "tax_region",
    }),
  })
  .checks([
    {
      name: taxRegionProviderTopLevelCheckName,
      expression: `parent_id IS NULL OR provider_id IS NULL`,
    },
    {
      name: taxRegionCountryTopLevelCheckName,
      expression: `parent_id IS NULL OR province_code IS NOT NULL`,
    },
  ])
  .indexes([
    {
      name: "IDX_tax_region_unique_country_province",
      on: ["country_code", "province_code"],
      unique: true,
      where: "deleted_at IS NULL",
    },
    {
      name: "IDX_tax_region_unique_country_nullable_province",
      on: ["country_code"],
      unique: true,
      where: "province_code IS NULL AND deleted_at IS NULL",
    },
  ])
  .cascades({
    delete: ["children", "tax_rates"],
  })

// @Check({
//   name: taxRegionProviderTopLevelCheckName,
//   expression: `parent_id IS NULL OR provider_id IS NULL`,
// })
// @Check({
//   name: taxRegionCountryTopLevelCheckName,
//   expression: `parent_id IS NULL OR province_code IS NOT NULL`,
// })
// @countryCodeNullableProvinceIndexStatement.MikroORMIndex()
// @countryCodeProvinceIndexStatement.MikroORMIndex()
// @Entity({ tableName: TABLE_NAME })
// @Filter(DALUtils.mikroOrmSoftDeletableFilterOptions)
// export default class TaxRegion {
// [OptionalProps]?: OptionalTaxRegionProps
// @PrimaryKey({ columnType: "text" })
// id!: string
// @ManyToOne(() => TaxProvider, {
//   fieldName: "provider_id",
//   mapToPk: true,
//   nullable: true,
// })
// provider_id: string | null = null
// @ManyToOne(() => TaxProvider, { persist: false })
// provider: Rel<TaxProvider>
// @Searchable()
// @Property({ columnType: "text" })
// country_code: string
// @Searchable()
// @Property({ columnType: "text", nullable: true })
// province_code: string | null = null
// @ManyToOne(() => TaxRegion, {
//   index: "IDX_tax_region_parent_id",
//   fieldName: "parent_id",
//   onDelete: "cascade",
//   mapToPk: true,
//   nullable: true,
// })
// parent_id: string | null = null
// @ManyToOne(() => TaxRegion, { persist: false })
// parent: Rel<TaxRegion>
// @OneToMany(() => TaxRate, (label) => label.tax_region, {
//   cascade: ["soft-remove" as Cascade],
// })
// tax_rates = new Collection<TaxRate>(this)
// @OneToMany(() => TaxRegion, (label) => label.parent, {
//   cascade: ["soft-remove" as Cascade],
// })
// children = new Collection<Rel<TaxRegion>>(this)
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
//   this.id = generateEntityId(this.id, "txreg")
// }
// @OnInit()
// onInit() {
//   this.id = generateEntityId(this.id, "txreg")
// }
// }
export default TaxRegion
