import { model } from "@medusajs/framework/utils"

import { FulfillmentSet } from "./fulfillment-set"
import { GeoZone } from "./geo-zone"
import { ShippingOption } from "./shipping-option"

export const ServiceZone = model
  .define("serivce_zone", {
    id: model.id({ prefix: "serzo" }).primaryKey(),
    name: model.text(),
    fulfillment_set: model.belongsTo(() => FulfillmentSet, {
      mappedBy: "service_zones",
    }),
    geo_zones: model.hasMany(() => GeoZone, {
      mappedBy: "service_zone",
    }),
    shipping_options: model.hasMany(() => ShippingOption, {
      mappedBy: "service_zone",
    }),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      on: ["name"],
      where: "deleted_at IS NULL",
    },
  ])
  .cascades({
    delete: ["geo_zones", "shipping_options"],
  })
