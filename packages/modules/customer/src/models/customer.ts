import { model } from "@medusajs/framework/utils"
import CustomerAddress from "./address"
import CustomerGroup from "./customer-group"
import CustomerGroupCustomer from "./customer-group-customer"

const Customer = model
  .define("Customer", {
    id: model.id({ prefix: "cus" }).primaryKey(),
    company_name: model.text().searchable().nullable(),
    first_name: model.text().searchable().nullable(),
    last_name: model.text().searchable().nullable(),
    email: model.text().searchable().nullable(),
    phone: model.text().searchable().nullable(),
    has_account: model.boolean().default(false),
    metadata: model.json().nullable(),
    created_by: model.text().nullable(),
    groups: model.manyToMany(() => CustomerGroup, {
      mappedBy: "customers",
      pivotEntity: () => CustomerGroupCustomer,
    }),
    addresses: model.hasMany(() => CustomerAddress, {
      mappedBy: "customer",
    }),
  })
  .cascades({
    delete: ["addresses"],
  })
  .indexes([
    {
      on: ["email", "has_account"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default Customer

// @Entity({ tableName: "customer" })
// @Filter(DALUtils.mikroOrmSoftDeletableFilterOptions)
// @CustomerUniqueEmail.MikroORMIndex()
// export default class Customer {
//   [OptionalProps]?: OptionalCustomerProps

// @PrimaryKey({ columnType: "text" })
// id: string

// @Searchable()
// @Property({ columnType: "text", nullable: true })
// company_name: string | null = null

// @Searchable()
// @Property({ columnType: "text", nullable: true })
// first_name: string | null = null

// @Searchable()
// @Property({ columnType: "text", nullable: true })
// last_name: string | null = null

// @Searchable()
// @Property({ columnType: "text", nullable: true })
// email: string | null = null

// @Searchable()
// @Property({ columnType: "text", nullable: true })
// phone: string | null = null

// @Property({ columnType: "boolean", default: false })
// has_account: boolean = false

// @Property({ columnType: "jsonb", nullable: true })
// metadata: Record<string, unknown> | null = null

// @ManyToMany({
//   mappedBy: "customers",
//   entity: () => CustomerGroup,
//   pivotEntity: () => CustomerGroupCustomer,
// })
// groups = new Collection<Rel<CustomerGroup>>(this)

// @OneToMany(() => CustomerAddress, (address) => address.customer, {
//   cascade: [Cascade.REMOVE],
// })
// addresses = new Collection<Rel<CustomerAddress>>(this)

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

// @Property({ columnType: "timestamptz", nullable: true })
// deleted_at: Date | null = null

// @Property({ columnType: "text", nullable: true })
// created_by: string | null = null

// @BeforeCreate()
// onCreate() {
//   this.id = generateEntityId(this.id, "cus")
// }

// @OnInit()
// onInit() {
//   this.id = generateEntityId(this.id, "cus")
// }
// }
