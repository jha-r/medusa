import { InformationCircle } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Tooltip } from "@medusajs/ui"
import { useCallback, useMemo } from "react"
import { createDataGridHelper } from "../../../../components/data-grid"
import {
  DataGridNumberCell,
  DataGridReadOnlyCell,
} from "../../../../components/data-grid/components"
import { DataGridDuplicateCell } from "../../../../components/data-grid/components/data-grid-duplicate-cell"
import { ProductInventorySchema } from "../schema"
import { ProductVariantInventoryItemLink } from "../types"
import { isProductVariant } from "../utils"

const helper = createDataGridHelper<
  HttpTypes.AdminProductVariant | ProductVariantInventoryItemLink,
  ProductInventorySchema
>()

type DisabledItem = { id: string; title: string; sku: string }
type DisabledResult =
  | {
      isDisabled: true
      item: DisabledItem
    }
  | {
      isDisabled: false
      item: undefined
    }

export const useProductInventoryColumns = (
  locations: HttpTypes.AdminStockLocation[] = [],
  disabled: Record<string, DisabledItem> = {}
) => {
  const getIsDisabled = useCallback(
    (item: ProductVariantInventoryItemLink): DisabledResult => {
      const disabledItem = disabled[item.inventory_item_id]
      const isDisabled = !!disabledItem && disabledItem.id !== item.variant_id

      if (!isDisabled) {
        return {
          isDisabled: false,
          item: undefined,
        }
      }

      return {
        isDisabled,
        item: disabledItem,
      }
    },
    [disabled]
  )

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

          const { isDisabled, item: disabledItem } = getIsDisabled(item)

          if (isDisabled) {
            return (
              <DataGridReadOnlyCell context={context}>
                <div className="flex size-full items-center justify-between gap-x-2">
                  <span
                    title={item.inventory.title || undefined}
                    className="opacity-30"
                  >
                    {item.inventory.title || "-"}
                  </span>
                  <Tooltip
                    content={`This inventory item is already editable under ${
                      disabledItem.title
                    }${disabledItem.sku ? ` (${disabledItem.sku})` : ""}`}
                  >
                    <InformationCircle />
                  </Tooltip>
                </div>
              </DataGridReadOnlyCell>
            )
          }

          return (
            <DataGridReadOnlyCell context={context}>
              {item.inventory.title || "-"}
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

          const { isDisabled } = getIsDisabled(item)

          if (isDisabled) {
            return (
              <DataGridReadOnlyCell context={context}>
                <span className="opacity-30">{item.inventory.sku || "-"}</span>
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

            const { isDisabled, item: disabledItem } = getIsDisabled(item)

            if (isDisabled) {
              return `variants.${disabledItem.id}.inventory_items.${item.inventory_item_id}.locations.${location.id}.quantity` as const
            }

            return `variants.${item.variant_id}.inventory_items.${item.inventory_item_id}.locations.${location.id}.quantity` as const
          },
          type: "number",
          cell: (context) => {
            const item = context.row.original

            if (isProductVariant(item)) {
              return <DataGridReadOnlyCell context={context} />
            }

            const { isDisabled } = getIsDisabled(item)

            if (isDisabled) {
              return (
                <DataGridDuplicateCell context={context}>
                  {({ value }) => (
                    <span className="size-full opacity-30">
                      {value as number | string}
                    </span>
                  )}
                </DataGridDuplicateCell>
              )
            }

            return <DataGridNumberCell context={context} />
          },
        })
      ),
    ],
    [locations, getIsDisabled]
  )
}
