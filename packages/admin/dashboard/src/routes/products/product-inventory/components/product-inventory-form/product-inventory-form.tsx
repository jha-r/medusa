import { zodResolver } from "@hookform/resolvers/zod"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import { DefaultValues, useForm } from "react-hook-form"
import { DataGrid } from "../../../../../components/data-grid"
import { RouteFocusModal } from "../../../../../components/modals"
import { useProductInventoryColumns } from "../../hooks/use-product-inventory-columns"
import {
  ProductInventoryInventoryItemSchema,
  ProductInventorySchema,
  ProductInventoryVariantSchema,
  ProductVariantLocationSchema,
} from "../../schema"
import { ProductVariantInventoryItemLink } from "../../types"
import { isProductVariantWithInventoryPivot } from "../../utils"

type ProductInventoryFormProps = {
  variants: HttpTypes.AdminProductVariant[]
  locations: HttpTypes.AdminStockLocation[]
}

export const ProductInventoryForm = ({
  variants,
  locations,
}: ProductInventoryFormProps) => {
  console.log(variants)

  console.log("defaultValues", getDefaultValue(variants as any, locations))

  const form = useForm<ProductInventorySchema>({
    // TODO: Update ProductVariant type to include inventory_items
    defaultValues: getDefaultValue(variants as any, locations),
    resolver: zodResolver(ProductInventorySchema),
  })

  const columns = useProductInventoryColumns(locations)

  return (
    <RouteFocusModal.Form form={form}>
      <RouteFocusModal.Header />
      <RouteFocusModal.Body>
        <DataGrid
          state={form}
          columns={columns}
          data={variants}
          getSubRows={getSubRows}
        />
      </RouteFocusModal.Body>
      <RouteFocusModal.Footer>
        <div className="flex items-center justify-end gap-2">
          <RouteFocusModal.Close asChild>
            <Button variant="secondary">Cancel</Button>
          </RouteFocusModal.Close>
          <Button>Save</Button>
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
          const stockedQuantity =
            item.inventory.location_levels?.find(
              (level) => level.location_id === location.id
            )?.stocked_quantity ?? ""

          locationAcc[location.id] = { quantity: stockedQuantity }
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
