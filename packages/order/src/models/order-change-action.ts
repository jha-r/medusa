import { BigNumberRawValue, DAL } from "@medusajs/types"
import {
  BigNumber,
  MikroOrmBigNumberProperty,
  createPsqlIndexStatementHelper,
  generateEntityId,
} from "@medusajs/utils"
import {
  BeforeCreate,
  Cascade,
  Entity,
  ManyToOne,
  OnInit,
  OptionalProps,
  PrimaryKey,
  Property,
} from "@mikro-orm/core"
import { Order } from "@models"
import OrderChange from "./order-change"

type OptionalLineItemProps = DAL.EntityDateColumns

const OrderChangeIdIndex = createPsqlIndexStatementHelper({
  tableName: "order_change_action",
  columns: "order_change_id",
})

const OrderIdIndex = createPsqlIndexStatementHelper({
  tableName: "order_change_action",
  columns: "order_id",
})

const ReferenceIndex = createPsqlIndexStatementHelper({
  tableName: "order_change_action",
  columns: ["reference", "reference_id"],
})

@Entity({ tableName: "order_change_action" })
@ReferenceIndex.MikroORMIndex()
export default class OrderChangeAction {
  [OptionalProps]?: OptionalLineItemProps

  @PrimaryKey({ columnType: "text" })
  id: string

  @ManyToOne({
    entity: () => Order,
    columnType: "text",
    fieldName: "order_id",
    cascade: [Cascade.REMOVE],
    mapToPk: true,
  })
  @OrderIdIndex.MikroORMIndex()
  order_id: string

  @ManyToOne(() => Order, {
    persist: false,
  })
  order: Order

  @ManyToOne({
    entity: () => OrderChange,
    columnType: "text",
    fieldName: "order_change_id",
    cascade: [Cascade.REMOVE],
    mapToPk: true,
    nullable: true,
  })
  @OrderChangeIdIndex.MikroORMIndex()
  order_change_id: string | null

  @ManyToOne(() => OrderChange, {
    persist: false,
    nullable: true,
  })
  order_change: OrderChange | null = null

  @Property({ columnType: "integer" })
  version: number

  @Property({
    columnType: "text",
    nullable: true,
  })
  reference: string | null = null

  @Property({
    columnType: "text",
    nullable: true,
  })
  reference_id: string | null = null

  @Property({ columnType: "text" })
  action: string

  @Property({ columnType: "jsonb" })
  details: Record<string, unknown> = {}

  @MikroOrmBigNumberProperty({ nullable: true })
  amount: BigNumber | number | null = null

  @Property({ columnType: "jsonb", nullable: true })
  raw_amount: BigNumberRawValue | null = null

  @Property({
    columnType: "text",
    nullable: true,
  })
  internal_note: string | null = null

  @Property({
    onCreate: () => new Date(),
    columnType: "timestamptz",
    defaultRaw: "now()",
  })
  created_at: Date

  @Property({
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
    columnType: "timestamptz",
    defaultRaw: "now()",
  })
  updated_at: Date

  @BeforeCreate()
  onCreate() {
    this.id = generateEntityId(this.id, "ordchact")
    this.order_id ??= this.order?.id
    this.order_change_id ??= this.order_change?.id ?? null
  }

  @OnInit()
  onInit() {
    this.id = generateEntityId(this.id, "ordchact")
    this.order_id ??= this.order?.id
    this.order_change_id ??= this.order_change?.id ?? null
  }
}
