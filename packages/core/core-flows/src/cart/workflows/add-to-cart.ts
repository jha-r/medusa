import { AddToCartWorkflowInputDTO } from "@medusajs/framework/types"
import { CartWorkflowEvents, isDefined } from "@medusajs/framework/utils"
import {
  createWorkflow,
  parallelize,
  transform,
  when,
  WorkflowData,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "../../common/steps/emit-event"
import { useRemoteQueryStep } from "../../common/steps/use-remote-query"
import {
  createLineItemsStep,
  getLineItemActionsStep,
  updateLineItemsStep,
} from "../steps"
import { validateCartStep } from "../steps/validate-cart"
import { validateLineItemPricesStep } from "../steps/validate-line-item-prices"
import { validateVariantPricesStep } from "../steps/validate-variant-prices"
import { productVariantsFields } from "../utils/fields"
import {
  prepareLineItemData,
  PrepareLineItemDataInput,
} from "../utils/prepare-line-item-data"
import { confirmVariantInventoryWorkflow } from "./confirm-variant-inventory"
import { refreshCartItemsWorkflow } from "./refresh-cart-items"

export const addToCartWorkflowId = "add-to-cart"
/**
 * This workflow adds items to a cart.
 */
export const addToCartWorkflow = createWorkflow(
  addToCartWorkflowId,
  (input: WorkflowData<AddToCartWorkflowInputDTO>) => {
    validateCartStep(input)

    const variantIds = transform({ input }, (data) => {
      return (data.input.items ?? []).map((i) => i.variant_id).filter(Boolean)
    })

    // TODO: This is on par with the context used in v1.*, but we can be more flexible.
    // TODO: create a common workflow to fetch variants and its prices
    const pricingContext = transform({ cart: input.cart }, (data) => {
      return {
        currency_code: data.cart.currency_code,
        region_id: data.cart.region_id,
        customer_id: data.cart.customer_id,
      }
    })

    const variants = when({ variantIds }, ({ variantIds }) => {
      return !!variantIds.length
    }).then(() => {
      return useRemoteQueryStep({
        entry_point: "variants",
        fields: productVariantsFields,
        variables: {
          id: variantIds,
          calculated_price: {
            context: pricingContext,
          },
        },
      })
    })

    validateVariantPricesStep({ variants })

    const lineItems = transform({ input, variants }, (data) => {
      const items = (data.input.items ?? []).map((item) => {
        const variant = (data.variants ?? []).find(
          (v) => v.id === item.variant_id
        )!

        const input: PrepareLineItemDataInput = {
          item,
          variant: variant,
          cartId: data.input.cart.id,
          unitPrice: item.unit_price ?? undefined,
          isTaxInclusive:
            item.is_tax_inclusive ??
            variant?.calculated_price?.is_calculated_price_tax_inclusive,
          isCustomPrice: isDefined(item?.unit_price),
        }

        if (variant && !input.unitPrice) {
          input.unitPrice = variant.calculated_price?.calculated_amount
        }

        return prepareLineItemData(input)
      })

      return items
    })

    validateLineItemPricesStep({ items: lineItems })

    const { itemsToCreate = [], itemsToUpdate = [] } = getLineItemActionsStep({
      id: input.cart.id,
      items: lineItems,
    })

    confirmVariantInventoryWorkflow.runAsStep({
      input: {
        sales_channel_id: input.cart.sales_channel_id as string,
        variants,
        items: input.items,
        itemsToUpdate,
      },
    })

    parallelize(
      createLineItemsStep({
        id: input.cart.id,
        items: itemsToCreate,
      }),
      updateLineItemsStep({
        id: input.cart.id,
        items: itemsToUpdate,
      })
    )

    refreshCartItemsWorkflow.runAsStep({
      input: { cart_id: input.cart.id },
    })

    emitEventStep({
      eventName: CartWorkflowEvents.UPDATED,
      data: { id: input.cart.id },
    })
  }
)
