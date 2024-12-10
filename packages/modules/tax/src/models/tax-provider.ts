import { model } from "@medusajs/framework/utils"
import { TaxRegion } from "@models"

const TaxProvider = model.define("TaxProvider", {
  id: model.id().primaryKey(),
  is_enabled: model.boolean().default(true),
  regions: model.hasMany(() => TaxRegion, {
    mappedBy: "provider",
  }),
})

export default TaxProvider

// const TABLE_NAME = "tax_provider"
// @Entity({ tableName: TABLE_NAME })
// export default class TaxProvider {
//   [OptionalProps]?: "is_enabled"

//   @PrimaryKey({ columnType: "text" })
//   id: string

//   @Property({
//     default: true,
//     columnType: "boolean",
//   })
//   is_enabled: boolean = true
// }
