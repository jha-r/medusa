import { HttpTypes } from "@medusajs/types"
import { useMemo } from "react"
import { Thumbnail } from "../../../../components/common/thumbnail"
import { createDataGridHelper } from "../../../../components/data-grid"
import {
  DataGridNumberCell,
  DataGridReadOnlyCell,
} from "../../../../components/data-grid/components"
import { ProductInventorySchema } from "../schema"
import { ProductVariantInventoryItemLink } from "../types"
import { isProductVariant } from "../utils"

const helper = createDataGridHelper<
  HttpTypes.AdminProductVariant | ProductVariantInventoryItemLink,
  ProductInventorySchema
>()

export const useProductInventoryColumns = (
  locations: HttpTypes.AdminStockLocation[] = []
) => {
  return useMemo(
    () => [
      helper.column({
        id: "title",
        name: "Title",
        header: "Title",
        cell: (context) => {
          const item = context.row.original

          if (isProductVariant(item)) {
            return (
              <DataGridReadOnlyCell context={context}>
                {item.title || "-"}
              </DataGridReadOnlyCell>
            )
          }

          return (
            <DataGridReadOnlyCell context={context}>
              <div className="flex items-center gap-x-1">
                <Thumbnail src={item.inventory.thumbnail} />
                <span title={item.inventory.title || undefined}>
                  {item.inventory.title || "-"}
                </span>
              </div>
            </DataGridReadOnlyCell>
          )
        },
        disableHiding: true,
      }),
      helper.column({
        id: "sku",
        name: "SKU",
        header: "SKU",
        cell: (context) => {
          const item = context.row.original

          if (isProductVariant(item)) {
            return (
              <DataGridReadOnlyCell context={context}>
                {item.sku || "-"}
              </DataGridReadOnlyCell>
            )
          }

          return (
            <DataGridReadOnlyCell context={context}>
              {item.inventory.sku || "-"}
            </DataGridReadOnlyCell>
          )
        },
        disableHiding: true,
      }),
      ...locations.map((location) =>
        helper.column({
          id: `location_${location.id}`,
          name: location.name,
          header: location.name,
          field: (context) => {
            const item = context.row.original

            if (isProductVariant(item)) {
              return null
            }

            return `variants.${item.variant_id}.inventory_items.${item.inventory_item_id}.locations.${location.id}.quantity` as const
          },
          type: "number",
          cell: (context) => {
            const item = context.row.original

            if (isProductVariant(item)) {
              return <DataGridReadOnlyCell context={context} />
            }

            return <DataGridNumberCell context={context} />
          },
        })
      ),
    ],
    [locations]
  )
}
