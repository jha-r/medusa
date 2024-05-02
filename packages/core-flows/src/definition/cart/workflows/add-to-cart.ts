import {
  AddToCartWorkflowInputDTO,
  CreateLineItemForCartDTO,
} from "@medusajs/types"
import {
  WorkflowData,
  createWorkflow,
  transform,
} from "@medusajs/workflows-sdk"
import { useRemoteQueryStep } from "../../../common/steps/use-remote-query"
import { addToCartStep, refreshCartShippingMethodsStep } from "../steps"
import { refreshCartPromotionsStep } from "../steps/refresh-cart-promotions"
import { updateTaxLinesStep } from "../steps/update-tax-lines"
import { cartFieldsForRefreshSteps } from "../utils/fields"
import { prepareLineItemData } from "../utils/prepare-line-item-data"
import { confirmVariantInventoryWorkflow } from "./confirm-variant-inventory"
import { refreshPaymentCollectionForCartStep } from "./refresh-payment-collection"

// TODO: The AddToCartWorkflow are missing the following steps:
// - Refresh/delete shipping methods (fulfillment module)

export const addToCartWorkflowId = "add-to-cart"
export const addToCartWorkflow = createWorkflow(
  addToCartWorkflowId,
  (input: WorkflowData<AddToCartWorkflowInputDTO>) => {
    const variantIds = transform({ input }, (data) => {
      return (data.input.items ?? []).map((i) => i.variant_id)
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

    confirmVariantInventoryWorkflow.runAsStep({
      input: {
        sales_channel_id: input.cart.sales_channel_id as string,
        variants,
        items: input.items,
      },
    })

    const lineItems = transform({ input, variants }, (data) => {
      const items = (data.input.items ?? []).map((item) => {
        const variant = data.variants.find((v) => v.id === item.variant_id)!

        return prepareLineItemData({
          variant: variant,
          unitPrice: variant.calculated_price.calculated_amount,
          quantity: item.quantity,
          metadata: item?.metadata ?? {},
          cartId: data.input.cart.id,
        }) as CreateLineItemForCartDTO
      })

      return items
    })

    const items = addToCartStep({ items: lineItems })

    const cart = useRemoteQueryStep({
      entry_point: "cart",
      fields: cartFieldsForRefreshSteps,
      variables: { id: input.cart.id },
      list: false,
    }).config({ name: "refetch–cart" })

    refreshCartShippingMethodsStep({ cart })
    // TODO: since refreshCartShippingMethodsStep potentially removes cart shipping methods, we need the updated cart here
    // for the following 2 steps as they act upon final cart shape
    updateTaxLinesStep({ cart_or_cart_id: cart, items })
    refreshCartPromotionsStep({ id: input.cart.id })
    refreshPaymentCollectionForCartStep({ cart_id: input.cart.id })

    return items
  }
)
