import {
  BigNumber,
  isDefined,
  MathBN,
  toMikroORMEntity,
} from "@medusajs/framework/utils"
import { MetadataStorage } from "@mikro-orm/core"

import InventoryItem from "../models/inventory-item"
import InventoryLevel from "../models/inventory-level"

function applyHook() {
  const MikroORMEntity = toMikroORMEntity(InventoryLevel)
  const meta = MetadataStorage.getMetadataFromDecorator(
    MikroORMEntity.prototype.constructor
  )

  meta.hooks.onInit ??= []
  if (meta.hooks.onInit.includes("onInit")) {
    return
  }

  MikroORMEntity.prototype["onInit"] = function (row) {
    const entity = row.entity
    if (
      isDefined(entity.stocked_quantity) &&
      isDefined(entity.reserved_quantity)
    ) {
      entity.available_quantity = new BigNumber(
        MathBN.sub(entity.raw_stocked_quantity, entity.raw_reserved_quantity)
      )
    }
  }

  meta.hooks.onInit.push("onInit")
}

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

export const applyEntityHooks = () => {
  applyHook()
  applyFormulas()
}
