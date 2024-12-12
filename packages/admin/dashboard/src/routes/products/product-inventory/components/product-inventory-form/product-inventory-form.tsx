import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import { useMemo } from "react"
import { DefaultValues, useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { DataGrid } from "../../../../../components/data-grid"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { useProductInventoryColumns } from "../../hooks/use-product-inventory-columns"
import {
  ProductInventoryInventoryItemSchema,
  ProductInventorySchema,
  ProductInventoryVariantSchema,
  ProductVariantLocationSchema,
} from "../../schema"
import { ProductVariantInventoryItemLink } from "../../types"
import {
  getDisabledInventoryRows,
  isProductVariantWithInventoryPivot,
} from "../../utils"

type ProductInventoryFormProps = {
  variants: HttpTypes.AdminProductVariant[]
  locations: HttpTypes.AdminStockLocation[]
}

export const ProductInventoryForm = ({
  variants,
  locations,
}: ProductInventoryFormProps) => {
  const { t } = useTranslation()
  const { setCloseOnEscape } = useRouteModal()

  const form = useForm<ProductInventorySchema>({
    // TODO: Update ProductVariant type to include inventory_items
    defaultValues: getDefaultValue(variants as any, locations),
    resolver: zodResolver(ProductInventorySchema),
  })

  const disabled = useMemo(
    () => getDisabledInventoryRows(variants as any),
    [variants]
  )
  const columns = useProductInventoryColumns(locations, disabled)

  return (
    <RouteFocusModal.Form form={form}>
      <RouteFocusModal.Header />
      <RouteFocusModal.Body>
        <DataGrid
          state={form}
          columns={columns}
          data={variants}
          getSubRows={getSubRows}
          onEditingChange={(editing) => setCloseOnEscape(!editing)}
        />
      </RouteFocusModal.Body>
      <RouteFocusModal.Footer>
        <div className="flex items-center justify-end gap-2">
          <RouteFocusModal.Close asChild>
            <Button variant="secondary" size="small" type="button">
              {t("actions.cancel")}
            </Button>
          </RouteFocusModal.Close>
          <Button type="submit" size="small">
            {t("actions.save")}
          </Button>
        </div>
      </RouteFocusModal.Footer>
    </RouteFocusModal.Form>
  )
}

function getSubRows(
  row: HttpTypes.AdminProductVariant | ProductVariantInventoryItemLink
): ProductVariantInventoryItemLink[] | undefined {
  if (isProductVariantWithInventoryPivot(row)) {
    return row.inventory_items
  }
}

function getDefaultValue(
  variants: (HttpTypes.AdminProductVariant & {
    inventory_items: ProductVariantInventoryItemLink[]
  })[],
  locations: HttpTypes.AdminStockLocation[]
): DefaultValues<ProductInventorySchema> {
  return {
    variants: variants.reduce((variantAcc, variant) => {
      const inventoryItems = variant.inventory_items.reduce((itemAcc, item) => {
        const locationsMap = locations.reduce((locationAcc, location) => {
          const levels = item.inventory.location_levels?.find(
            (level) => level.location_id === location.id
          )

          locationAcc[location.id] = {
            quantity: levels?.stocked_quantity || "",
            levels_id: levels?.id,
            checked: !!levels,
          }
          return locationAcc
        }, {} as ProductVariantLocationSchema)

        itemAcc[item.inventory_item_id] = { locations: locationsMap }
        return itemAcc
      }, {} as Record<string, ProductInventoryInventoryItemSchema>)

      variantAcc[variant.id] = { inventory_items: inventoryItems }
      return variantAcc
    }, {} as Record<string, ProductInventoryVariantSchema>),
  }
}
