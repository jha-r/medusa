import { useProductVariants, useStockLocations } from "../../../../hooks/api"

export const useProductInventoryData = (id: string) => {
  const variantData = useProductVariants(id, {
    limit: 9999,
    fields:
      "id,title,sku,inventory_items,inventory_items.*,inventory_items.inventory,inventory_items.inventory.id,inventory_items.inventory.title,inventory_items.inventory.sku,*inventory_items.inventory.location_levels",
  })

  const locationData = useStockLocations({
    limit: 9999,
    fields: "id,name",
  })

  const isLoaded =
    !variantData.isPending &&
    !locationData.isPending &&
    !!variantData.variants &&
    !!locationData.stock_locations

  if (variantData.isError) {
    throw variantData.error
  }

  if (locationData.isError) {
    throw locationData.error
  }

  return {
    variants: variantData.variants || [],
    locations: locationData.stock_locations || [],
    isLoaded,
  }
}
