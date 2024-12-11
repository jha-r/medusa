import { HttpTypes } from "@medusajs/types"
import { useMemo } from "react"
import { Thumbnail } from "../../../../components/common/thumbnail"
import { createDataGridHelper } from "../../../../components/data-grid"
import {
  DataGridNumberCell,
  DataGridReadOnlyCell,
} from "../../../../components/data-grid/components"
import { InventoryStockSchema } from "../schema"

const helper = createDataGridHelper<
  HttpTypes.AdminInventoryItem,
  InventoryStockSchema
>()

export const useInventoryStockColumns = (
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
          return (
            <DataGridReadOnlyCell context={context}>
              <div className="flex items-center gap-x-1">
                <Thumbnail src={item.thumbnail} />
                <span title={item.title || undefined}>{item.title || "-"}</span>
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

          return (
            <DataGridReadOnlyCell context={context}>
              {item.sku || "-"}
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

            return `inventory_items.${item.id}.locations.${location.id}.quantity` as const
          },
          type: "number",
          cell: (context) => {
            return <DataGridNumberCell context={context} />
          },
        })
      ),
    ],
    [locations]
  )
}
