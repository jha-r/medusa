import { model } from "@medusajs/framework/utils"
import Customer from "./customer"

const CustomerAddress = model
  .define("CustomerAddress", {
    id: model.id({ prefix: "cuaddr" }).primaryKey(),
    address_name: model.text().searchable().nullable(),
    is_default_shipping: model.boolean().default(false),
    is_default_billing: model.boolean().default(false),
    company: model.text().searchable().nullable(),
    first_name: model.text().searchable().nullable(),
    last_name: model.text().searchable().nullable(),
    address_1: model.text().searchable().nullable(),
    address_2: model.text().searchable().nullable(),
    city: model.text().searchable().nullable(),
    country_code: model.text().nullable(),
    province: model.text().searchable().nullable(),
    postal_code: model.text().searchable().nullable(),
    phone: model.text().nullable(),
    metadata: model.json().nullable(),
    customer: model.belongsTo(() => Customer, {
      mappedBy: "addresses",
    }),
  })
  .indexes([
    {
      name: "IDX_customer_address_unique_customer_billing",
      on: ["customer_id"],
      unique: true,
      where: '"is_default_billing" = true',
    },
    {
      name: "IDX_customer_address_unique_customer_shipping",
      on: ["customer_id"],
      unique: true,
      where: '"is_default_shipping" = true',
    },
  ])

export default CustomerAddress

// @Entity({ tableName: "customer_address" })
// @CustomerAddressUniqueCustomerShippingAddress.MikroORMIndex()
// @CustomerAddressUniqueCustomerBillingAddress.MikroORMIndex()
// export default class CustomerAddress {
// @PrimaryKey({ columnType: "text" })
// id!: string
// @Searchable()
// @Property({ columnType: "text", nullable: true })
// address_name: string | null = null
// @Property({ columnType: "boolean", default: false })
// is_default_shipping: boolean = false
// @Property({ columnType: "boolean", default: false })
// is_default_billing: boolean = false
// @Property({ columnType: "text" })
// customer_id: string
// @ManyToOne(() => Customer, {
//   fieldName: "customer_id",
//   index: "IDX_customer_address_customer_id",
//   cascade: [Cascade.REMOVE, Cascade.PERSIST],
// })
// customer: Customer
// @Searchable()
// @Property({ columnType: "text", nullable: true })
// company: string | null = null
// @Searchable()
// @Property({ columnType: "text", nullable: true })
// first_name: string | null = null
// @Searchable()
// @Property({ columnType: "text", nullable: true })
// last_name: string | null = null
// @Searchable()
// @Property({ columnType: "text", nullable: true })
// address_1: string | null = null
// @Searchable()
// @Property({ columnType: "text", nullable: true })
// address_2: string | null = null
// @Searchable()
// @Property({ columnType: "text", nullable: true })
// city: string | null = null
// @Property({ columnType: "text", nullable: true })
// country_code: string | null = null
// @Searchable()
// @Property({ columnType: "text", nullable: true })
// province: string | null = null
// @Searchable()
// @Property({ columnType: "text", nullable: true })
// postal_code: string | null = null
// @Property({ columnType: "text", nullable: true })
// phone: string | null = null
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
// @BeforeCreate()
// onCreate() {
//   this.id = generateEntityId(this.id, "cuaddr")
// }
// @OnInit()
// onInit() {
//   this.id = generateEntityId(this.id, "cuaddr")
// }
// }
