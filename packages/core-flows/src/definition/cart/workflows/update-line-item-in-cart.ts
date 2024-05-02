import { UpdateLineItemInCartWorkflowInputDTO } from "@medusajs/types"
import {
  WorkflowData,
  createWorkflow,
  transform,
} from "@medusajs/workflows-sdk"
import { MedusaError } from "medusa-core-utils"
import { useRemoteQueryStep } from "../../../common/steps/use-remote-query"
import { updateLineItemsStep } from "../../line-item/steps"
import { confirmInventoryStep, refreshCartShippingMethodsStep } from "../steps"
import { refreshCartPromotionsStep } from "../steps/refresh-cart-promotions"
import { cartFieldsForRefreshSteps } from "../utils/fields"
import { prepareConfirmInventoryInput } from "../utils/prepare-confirm-inventory-input"
import { refreshPaymentCollectionForCartStep } from "./refresh-payment-collection"

// TODO: The UpdateLineItemsWorkflow are missing the following steps:
// - Validate shipping methods for new items (fulfillment module)

export const updateLineItemInCartWorkflowId = "update-line-item-in-cart"
export const updateLineItemInCartWorkflow = createWorkflow(
  updateLineItemInCartWorkflowId,
  (input: WorkflowData<UpdateLineItemInCartWorkflowInputDTO>) => {
    const variantIds = transform({ input }, (data) => {
      return [data.input.item.variant_id]
    })

    // TODO: This is on par with the context used in v1.*, but we can be more flexible.
    const pricingContext = transform({ cart: input.cart }, (data) => {
      return {
        currency_code: data.cart.currency_code,
        region_id: data.cart.region_id,
        customer_id: data.cart.customer_id,
      }
    })

    const variants = useRemoteQueryStep({
      entry_point: "variants",
      fields: [
        "id",
        "title",
        "sku",
        "barcode",
        "manage_inventory",
        "allow_backorder",
        "product.id",
        "product.title",
        "product.description",
        "product.subtitle",
        "product.thumbnail",
        "product.type",
        "product.collection",
        "product.handle",

        "calculated_price.calculated_amount",

        "inventory_items.inventory_item_id",
        "inventory_items.required_quantity",

        "inventory_items.inventory.location_levels.stock_locations.id",
        "inventory_items.inventory.location_levels.stock_locations.name",

        "inventory_items.inventory.location_levels.stock_locations.sales_channels.id",
        "inventory_items.inventory.location_levels.stock_locations.sales_channels.name",
      ],
      variables: {
        id: variantIds,
        calculated_price: {
          context: pricingContext,
        },
      },
      throw_if_key_not_found: true,
    })

    const confirmInventoryInput = transform({ input, variants }, (data) => {
      const managedVariants = data.variants.filter((v) => v.manage_inventory)
      if (!managedVariants.length) {
        return { items: [] }
      }

      const productVariantInventoryItems: any[] = []

      const stockLocations = data.variants
        .map((v) => v.inventory_items)
        .flat()
        .map((ii) => {
          productVariantInventoryItems.push({
            variant_id: ii.variant_id,
            inventory_item_id: ii.inventory_item_id,
            required_quantity: ii.required_quantity,
          })

          return ii.inventory.location_levels
        })
        .flat()
        .map((ll) => ll.stock_locations)
        .flat()

      const salesChannelId = data.input.cart.sales_channel_id
      if (salesChannelId) {
        const salesChannels = stockLocations
          .map((sl) => sl.sales_channels)
          .flat()
          .filter((sc) => sc.id === salesChannelId)

        if (!salesChannels.length) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Sales channel ${salesChannelId} is not associated with any stock locations.`
          )
        }
      }

      const priceNotFound: string[] = data.variants
        .filter((v) => !v.calculated_price)
        .map((v) => v.id)

      if (priceNotFound.length) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Variants with IDs ${priceNotFound.join(", ")} do not have a price`
        )
      }

      const items = prepareConfirmInventoryInput({
        product_variant_inventory_items: productVariantInventoryItems,
        location_ids: stockLocations.map((l) => l.id),
        items: [data.input.item!],
        variants: data.variants.map((v) => ({
          id: v.id,
          manage_inventory: v.manage_inventory,
        })),
      })

      return { items }
    })

    confirmInventoryStep(confirmInventoryInput)

    const lineItemUpdate = transform({ input, variants }, (data) => {
      const variant = data.variants[0]
      const item = data.input.item

      return {
        data: {
          ...data.input.update,
          unit_price: variant.calculated_price.calculated_amount,
        },
        selector: {
          id: item.id,
        },
      }
    })

    const result = updateLineItemsStep(lineItemUpdate)

    const cart = useRemoteQueryStep({
      entry_point: "cart",
      fields: cartFieldsForRefreshSteps,
      variables: { id: input.cart.id },
      list: false,
    }).config({ name: "refetch–cart" })

    refreshCartShippingMethodsStep({ cart })
    refreshCartPromotionsStep({ id: input.cart.id })
    refreshPaymentCollectionForCartStep({ cart_id: input.cart.id })

    const updatedItem = transform({ result }, (data) => data.result?.[0])

    return updatedItem
  }
)
