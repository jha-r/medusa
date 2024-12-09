import { GeoZoneType, model } from "@medusajs/framework/utils"

import ServiceZone from "./service-zone"

export const GeoZone = model
  .define("geo_zone", {
    id: model.id({ prefix: "fgz" }).primaryKey(),
    type: model.enum(GeoZoneType).default(GeoZoneType.COUNTRY),
    country_code: model.text(),
    province_code: model.text().nullable(),
    city: model.text().nullable(),
    postal_expression: model.json().nullable(),
    service_zone: model.belongsTo(() => ServiceZone, {
      mappedBy: "geo_zones",
    }),
    metadata: model.json().nullable(),
  })
  .indexes([
    {
      on: ["country_code"],
      where: "deleted_at IS NULL",
    },
    {
      on: ["province_code"],
      where: "deleted_at IS NULL",
    },
    {
      on: ["city"],
      where: "deleted_at IS NULL",
    },
  ])
