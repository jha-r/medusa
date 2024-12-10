import { model } from "@medusajs/framework/utils"
import StockLocationAddress from "./stock-location-address"

const StockLocation = model.define("StockLocation", {
  id: model.id({ prefix: "sloc" }).primaryKey(),
  name: model.text().searchable(),
  metadata: model.json().nullable(),
  address: model
    .belongsTo(() => StockLocationAddress, {
      // foreignKey: true,
      mappedBy: "stock_locations",
    })
    .nullable(),
})
// .cascades({
//   delete: ["address"],
// })

export default StockLocation
