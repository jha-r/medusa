import {
  Entity,
  RelationId,
  BeforeInsert,
  Column,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  OneToOne,
  OneToMany,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from "typeorm"
import { ulid } from "ulid"

import { Order } from "./order"
import { FulfillmentProvider } from "./fulfillment-provider"
import { FulfillmentItem } from "./fulfillment-item"
import { Swap } from "./swap"
import { ClaimOrder } from "./claim-order"

@Entity()
export class Fulfillment {
  @PrimaryColumn()
  id: string

  @Column({ nullable: true })
  claim_order_id: string

  @ManyToOne(
    () => ClaimOrder,
    co => co.fulfillments
  )
  @JoinColumn({ name: "claim_order_id" })
  claim_order: ClaimOrder

  @Column({ nullable: true })
  swap_id: string

  @ManyToOne(
    () => Swap,
    swap => swap.fulfillments
  )
  @JoinColumn({ name: "swap_id" })
  swap: Swap

  @Column({ nullable: true })
  order_id: string

  @ManyToOne(
    () => Order,
    o => o.fulfillments
  )
  @JoinColumn({ name: "order_id" })
  order: Order

  @Column()
  provider_id: string

  @ManyToOne(() => FulfillmentProvider)
  @JoinColumn({ name: "provider_id" })
  provider: FulfillmentProvider

  @OneToMany(
    () => FulfillmentItem,
    i => i.fulfillment,
    { eager: true, cascade: true }
  )
  items: FulfillmentItem[]

  @Column({ type: "jsonb", default: [] })
  tracking_numbers: string[]

  @Column({ type: "jsonb" })
  data: any

  @Column({ type: "timestamptz", nullable: true })
  shipped_at: Date

  @Column({ type: "timestamptz", nullable: true })
  canceled_at: Date

  @CreateDateColumn({ type: "timestamptz" })
  created_at: Date

  @UpdateDateColumn({ type: "timestamptz" })
  updated_at: Date

  @Column({ type: "jsonb", nullable: true })
  metadata: any

  @Column({ nullable: true })
  idempotency_key: string

  @BeforeInsert()
  private beforeInsert() {
    if (this.id) return
    const id = ulid()
    this.id = `ful_${id}`
  }
}
