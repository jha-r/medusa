import { model } from "@medusajs/framework/utils"

import { OrderExchangeItem } from "./exchange-item"
import { Order } from "./order"
import { OrderShipping } from "./order-shipping-method"
import { Return } from "./return"
import { OrderTransaction } from "./transaction"

const _OrderExchange = model
  .define("OrderExchange", {
    id: model.id({ prefix: "oexc" }).primaryKey(),
    order_version: model.number(),
    display_id: model.autoincrement(),
    no_notification: model.boolean().nullable(),
    difference_due: model.bigNumber().nullable(),
    allow_backorder: model.boolean().default(false),
    created_by: model.text().nullable(),
    metadata: model.json().nullable(),
    canceled_at: model.dateTime().nullable(),
    order: model.belongsTo<() => typeof Order>(() => Order, {
      mappedBy: "exchanges",
    }),
    return: model
      .belongsTo<() => typeof Return>(() => Return, {
        mappedBy: "exchange",
      })
      .nullable(),
    additional_items: model.hasMany<() => typeof OrderExchangeItem>(
      () => OrderExchangeItem,
      {
        mappedBy: "exchange",
      }
    ),
    shipping_methods: model.hasMany<() => typeof OrderShipping>(
      () => OrderShipping,
      {
        mappedBy: "exchange",
      }
    ),
    transactions: model.hasMany<() => typeof OrderTransaction>(
      () => OrderTransaction,
      {
        mappedBy: "exchange",
      }
    ),
  })
  .cascades({
    delete: ["additional_items", "shipping_methods", "transactions"],
  })
  .indexes([
    {
      name: "IDX_order_exchange_display_id",
      on: ["display_id"],
      unique: false,
      where: "deleted_at IS NOT NULL",
    },
    {
      name: "IDX_order_exchange_deleted_at",
      on: ["deleted_at"],
      unique: false,
      where: "deleted_at IS NOT NULL",
    },
    {
      name: "IDX_order_exchange_order_id",
      on: ["order_id"],
      unique: false,
      where: "deleted_at IS NOT NULL",
    },
    {
      name: "IDX_order_exchange_return_id",
      on: ["return_id"],
      unique: false,
      where: "return_id IS NOT NULL AND deleted_at IS NOT NULL",
    },
  ])

export const OrderExchange = _OrderExchange
