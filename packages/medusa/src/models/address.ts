import {
  Entity,
  BeforeInsert,
  Column,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm"
import randomize from "randomatic"

import { Customer } from "./customer"
import { Country } from "./country"

@Entity()
export class Address {
  @PrimaryColumn()
  id: string

  @Column({ nullable: true })
  customer_id: string

  @ManyToOne(() => Customer)
  @JoinColumn({ name: "customer_id" })
  customer: Customer

  @Column({ nullable: true })
  first_name: string

  @Column({ nullable: true })
  last_name: string

  @Column({ nullable: true })
  address_1: string

  @Column({ nullable: true })
  address_2: string

  @Column({ nullable: true })
  city: string

  @Column({ nullable: true })
  country_code: string

  @ManyToOne(() => Country)
  @JoinColumn({ name: "country_code", referencedColumnName: "iso_2" })
  country: Country

  @Column({ nullable: true })
  province: string

  @Column({ nullable: true })
  postal_code: string

  @Column({ nullable: true })
  phone: string

  @CreateDateColumn({ type: "timestamp" })
  created_at: Date

  @UpdateDateColumn({ type: "timestamp" })
  updated_at: Date

  @DeleteDateColumn({ type: "timestamp" })
  deleted_at: Date

  @Column({ type: "jsonb", nullable: true })
  metadata: any

  @BeforeInsert()
  private beforeInsert() {
    const id = randomize("Aa0", 10)
    this.id = `addr_${id}`
  }
}
