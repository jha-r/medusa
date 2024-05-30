import { isPresent } from "@medusajs/utils"
import { MedusaRequest, MedusaResponse } from "../../../../types/routing"
import { refetchProduct, wrapVariantsWithInventoryQuantity } from "../helpers"
import { StoreGetProductsParamsType } from "../validators"

export const GET = async (
  req: MedusaRequest<StoreGetProductsParamsType>,
  res: MedusaResponse
) => {
  const filters: object = {
    id: req.params.id,
    ...req.filterableFields,
  }

  if (isPresent(req.pricingContext)) {
    filters["context"] = {
      "variants.calculated_price": { context: req.pricingContext },
    }
  }

  const product = await refetchProduct(
    filters,
    req.scope,
    req.remoteQueryConfig.fields
  )

  if (req.context?.with_inventory_quantity) {
    await wrapVariantsWithInventoryQuantity(req, product.variants || [])
  }

  res.json({ product })
}
