import { HttpTypes } from "@medusajs/types"
import { ProductVariantInventoryItemLink } from "./types"

export function isProductVariant(
  row: HttpTypes.AdminProductVariant | ProductVariantInventoryItemLink
): row is HttpTypes.AdminProductVariant {
  return row.id.startsWith("variant_")
}

export function isProductVariantWithInventoryPivot(
  row: HttpTypes.AdminProductVariant | ProductVariantInventoryItemLink
): row is HttpTypes.AdminProductVariant & {
  inventory_items: ProductVariantInventoryItemLink[]
} {
  return (row as any).inventory_items && (row as any).inventory_items.length > 0
}
