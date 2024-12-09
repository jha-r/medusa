import { model } from "@medusajs/framework/utils"
import Customer from "./customer"
import { CustomerGroupCustomer } from "@models"

const CustomerGroup = model
  .define("CustomerGroup", {
    id: model.id({ prefix: "cusgroup" }).primaryKey(),
    name: model.text().searchable(),
    metadata: model.json().nullable(),
    created_by: model.text().nullable(),
    customers: model.manyToMany(() => Customer, {
      mappedBy: "groups",
      pivotEntity: () => CustomerGroupCustomer,
    }),
  })
  .indexes([
    {
      on: ["name"],
      unique: true,
      where: "deleted_at IS NULL",
    },
  ])

export default CustomerGroup

// @Entity({ tableName: "customer_group" })
// @Filter(DALUtils.mikroOrmSoftDeletableFilterOptions)
// export default class CustomerGroup {
//   [OptionalProps]: OptionalGroupProps

// @PrimaryKey({ columnType: "text" })
// id!: string

// @Searchable()
// @CustomerGroupUniqueName.MikroORMIndex()
// @Property({ columnType: "text" })
// name: string

// @ManyToMany({
//   entity: () => Customer,
//   pivotEntity: () => CustomerGroupCustomer,
// })
// customers = new Collection<Rel<Customer>>(this)

// @Property({ columnType: "jsonb", nullable: true })
// metadata: Record<string, unknown> | null = null

// @Property({ columnType: "text", nullable: true })
// created_by: string | null = null

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

// @BeforeCreate()
// onCreate() {
//   this.id = generateEntityId(this.id, "cusgroup")
// }

// @OnInit()
// onInit() {
//   this.id = generateEntityId(this.id, "cusgroup")
// }
// }
