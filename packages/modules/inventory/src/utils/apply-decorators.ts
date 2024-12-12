import {
  BigNumber,
  isDefined,
  MathBN,
  toMikroORMEntity,
} from "@medusajs/framework/utils"
import { MetadataStorage, OnLoad } from "@mikro-orm/core"

import InventoryItem from "../models/inventory-item"
import InventoryLevel from "../models/inventory-level"

const MikroORMEntity = toMikroORMEntity(InventoryLevel)
MikroORMEntity.prototype["onLoad"] = function () {
  if (isDefined(this.stocked_quantity) && isDefined(this.reserved_quantity)) {
    this.available_quantity = new BigNumber(
      MathBN.sub(this.raw_stocked_quantity, this.raw_reserved_quantity)
    )
  }
}
OnLoad()(MikroORMEntity.prototype, "onLoad")

function applyFormulas() {
  const MikroORMEntity = toMikroORMEntity(InventoryItem)

  const meta = MetadataStorage.getMetadataFromDecorator(
    MikroORMEntity.prototype.constructor
  )

  const props = meta.properties

  const reservedQuantity = props["reserved_quantity"]
  if (!reservedQuantity.formula) {
    reservedQuantity.formula = (item) =>
      `(SELECT SUM(reserved_quantity)::float FROM inventory_level il WHERE il.inventory_item_id = ${item}.id AND il.deleted_at IS NULL)`
    reservedQuantity.lazy = true
  }

  const stockedQuantity = props["stocked_quantity"]
  if (!stockedQuantity.formula) {
    stockedQuantity.formula = (item) =>
      `(SELECT SUM(stocked_quantity)::float FROM inventory_level il WHERE il.inventory_item_id = ${item}.id AND il.deleted_at IS NULL)`
    stockedQuantity.lazy = true
  }
}
applyFormulas()
