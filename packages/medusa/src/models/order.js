import mongoose from "mongoose"
import { BaseModel } from "medusa-interfaces"

import LineItemSchema from "./schemas/line-item"
import PaymentMethodSchema from "./schemas/payment-method"
import ShippingMethodSchema from "./schemas/shipping-method"
import AddressSchema from "./schemas/address"
import DiscountSchema from "./schemas/discount"
import ShipmentSchema from "./schemas/shipment"
import ReturnSchema from "./schemas/return"
import RefundSchema from "./schemas/refund"
import FulfillmentSchema from "./schemas/fulfillment"

class OrderModel extends BaseModel {
  static modelName = "Order"

  static schema = {
    display_id: { type: String, required: true, unique: true },
    // pending, completed, failed, archived, cancelled
    status: { type: String, default: "pending" },
    // not_fulfilled, partially_fulfilled, fulfilled, returned,
    // partially_returned, shipped, partially_shipped
    fulfillment_status: { type: String, default: "not_fulfilled" },
    // awaiting, captured, refunded, partially_refunded, failed
    payment_status: { type: String, default: "awaiting" },
    email: { type: String, required: true },
    cart_id: { type: String, unique: true, sparse: true },
    billing_address: { type: AddressSchema, required: true },
    shipping_address: { type: AddressSchema, required: true },
    items: { type: [LineItemSchema], required: true },
    currency_code: { type: String, required: true },
    tax_rate: { type: Number, required: true },
    fulfillments: { type: [FulfillmentSchema], default: [] },
    returns: { type: [ReturnSchema], default: [] },
    refunds: { type: [RefundSchema], default: [] },
    region_id: { type: String, required: true },
    discounts: { type: [DiscountSchema], default: [] },
    customer_id: { type: String },
    payment_method: { type: PaymentMethodSchema, default: {} },
    shipping_methods: { type: [ShippingMethodSchema], default: [] },
    documents: { type: [String], default: [] },
    created: { type: String, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  }
}

export default OrderModel
