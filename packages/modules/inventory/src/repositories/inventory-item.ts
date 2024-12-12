import { Context, DAL, InferEntityType } from "@medusajs/framework/types"
import { mikroOrmBaseRepositoryFactory } from "@medusajs/framework/utils"
import { SqlEntityManager } from "@mikro-orm/postgresql"
import { InventoryItem } from "@models"

function applyFormulas(manager) {
  const props = manager.metadata.metadata["InventoryItem"]?.props

  const reservedQuantity = props.find(
    (prop) => prop.name === "reserved_quantity"
  )
  if (!reservedQuantity.formula) {
    reservedQuantity.formula = (item) =>
      `(SELECT SUM(reserved_quantity)::float FROM inventory_level il WHERE il.inventory_item_id = ${item}.id AND il.deleted_at IS NULL)`
    reservedQuantity.lazy = true
  }

  const stockedQuantity = props.find((prop) => prop.name === "stocked_quantity")
  if (!stockedQuantity.formula) {
    stockedQuantity.formula = (item) =>
      `(SELECT SUM(stocked_quantity)::float FROM inventory_level il WHERE il.inventory_item_id = ${item}.id AND il.deleted_at IS NULL)`
    stockedQuantity.lazy = true
  }
}

export class InventoryItemRepository extends mikroOrmBaseRepositoryFactory(
  InventoryItem
) {
  async find(
    params?: DAL.FindOptions<typeof InventoryItem>,
    context?: Context
  ): Promise<InferEntityType<typeof InventoryItem>[]> {
    const manager = this.getActiveManager(context) as SqlEntityManager

    applyFormulas(manager)

    return (await manager.find(
      this.entity,
      params?.where!,
      params?.options as any
    )) as unknown as InferEntityType<typeof InventoryItem>[]
  }

  async findAndCount(
    params?: DAL.FindOptions<typeof InventoryItem>,
    context?: Context
  ): Promise<[InferEntityType<typeof InventoryItem>[], number]> {
    const manager = this.getActiveManager(context) as SqlEntityManager

    applyFormulas(manager)

    return (await manager.findAndCount(
      this.entity,
      params?.where!,
      params?.options as any
    )) as unknown as [InferEntityType<typeof InventoryItem>[], number]
  }
}
