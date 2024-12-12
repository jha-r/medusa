import {
  BigNumber,
  isDefined,
  MathBN,
  toMikroORMEntity,
} from "@medusajs/framework/utils"
import InventoryLevel from "../models/inventory-level"
import { Formula, OnLoad } from "@mikro-orm/core"
import InventoryItem from "../models/inventory-item"

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
  Formula(
    (item) =>
      `(SELECT SUM(reserved_quantity) FROM inventory_level il WHERE il.inventory_item_id = ${item}.id AND il.deleted_at IS NULL)`,
    { lazy: true, serializer: Number, hidden: true }
  )(MikroORMEntity, "reserved_quantity")

  Formula(
    (item) =>
      `(SELECT SUM(stocked_quantity) FROM inventory_level il WHERE il.inventory_item_id = ${item}.id AND il.deleted_at IS NULL)`,
    { lazy: true, serializer: Number, hidden: true }
  )(MikroORMEntity, "stocked_quantity")
}

applyFormulas()

export { default as InventoryLevelService } from "./inventory-level"
export { default as InventoryModuleService } from "./inventory-module"
