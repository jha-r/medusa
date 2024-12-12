import {
  BigNumberInput,
  Context,
  DAL,
  InferEntityType,
} from "@medusajs/framework/types"
import {
  BigNumber,
  isDefined,
  MathBN,
  mikroOrmBaseRepositoryFactory,
} from "@medusajs/framework/utils"
import { SqlEntityManager } from "@mikro-orm/postgresql"
import { InventoryLevel } from "@models"

export class InventoryLevelRepository extends mikroOrmBaseRepositoryFactory(
  InventoryLevel
) {
  async getReservedQuantity(
    inventoryItemId: string,
    locationIds: string[],
    context: Context = {}
  ): Promise<BigNumber> {
    const manager = super.getActiveManager<SqlEntityManager>(context)

    const result = await manager
      .getKnex()({ il: "inventory_level" })
      .select("raw_reserved_quantity")
      .whereIn("location_id", locationIds)
      .andWhere("inventory_item_id", inventoryItemId)
      .andWhereRaw("deleted_at IS NULL")

    return new BigNumber(
      MathBN.sum(...result.map((r) => r.raw_reserved_quantity))
    )
  }

  async getAvailableQuantity(
    inventoryItemId: string,
    locationIds: string[],
    context: Context = {}
  ): Promise<BigNumber> {
    const knex = super.getActiveManager<SqlEntityManager>(context).getKnex()

    const result = await knex({
      il: "inventory_level",
    })
      .select("raw_stocked_quantity", "raw_reserved_quantity")
      .whereIn("location_id", locationIds)
      .andWhere("inventory_item_id", inventoryItemId)
      .andWhereRaw("deleted_at IS NULL")

    return new BigNumber(
      MathBN.sum(
        ...result.map((r) => {
          return MathBN.sub(r.raw_stocked_quantity, r.raw_reserved_quantity)
        })
      )
    )
  }

  async getStockedQuantity(
    inventoryItemId: string,
    locationIds: string[],
    context: Context = {}
  ): Promise<BigNumber> {
    const knex = super.getActiveManager<SqlEntityManager>(context).getKnex()

    const result = await knex({
      il: "inventory_level",
    })
      .select("raw_stocked_quantity")
      .whereIn("location_id", locationIds)
      .andWhere("inventory_item_id", inventoryItemId)
      .andWhereRaw("deleted_at IS NULL")

    return new BigNumber(
      MathBN.sum(...result.map((r) => r.raw_stocked_quantity))
    )
  }

  async find(
    params?: DAL.FindOptions<typeof InventoryLevel>,
    context?: Context
  ): Promise<InferEntityType<typeof InventoryLevel>[]> {
    const manager = this.getActiveManager(context) as SqlEntityManager

    const resultset = (await manager.find(
      this.entity,
      params?.where!,
      params?.options as any
    )) as unknown as InferEntityType<typeof InventoryLevel>[]

    resultset.forEach((item) => {
      if (
        isDefined(item.stocked_quantity) &&
        isDefined(item.reserved_quantity)
      ) {
        ;(item as any).available_quantity = new BigNumber(
          MathBN.sub(
            item.raw_stocked_quantity as BigNumberInput,
            item.raw_reserved_quantity as BigNumberInput
          )
        ) as any
      }
    })

    return resultset
  }

  async findAndCount(
    params?: DAL.FindOptions<typeof InventoryLevel>,
    context?: Context
  ): Promise<[InferEntityType<typeof InventoryLevel>[], number]> {
    const manager = this.getActiveManager(context) as SqlEntityManager

    const [resultset, count] = (await manager.findAndCount(
      this.entity,
      params?.where!,
      params?.options as any
    )) as unknown as [InferEntityType<typeof InventoryLevel>[], number]

    resultset.forEach((item) => {
      if (
        isDefined(item.stocked_quantity) &&
        isDefined(item.reserved_quantity)
      ) {
        ;(item as any).available_quantity = new BigNumber(
          MathBN.sub(
            item.raw_stocked_quantity as BigNumberInput,
            item.raw_reserved_quantity as BigNumberInput
          )
        ) as any
      }
    })

    return [resultset, count]
  }
}
