import {
  filterObjectByKeys,
  isDefined,
  PromotionActions,
} from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useRemoteQueryStep } from "../../common/steps/use-remote-query"
import { updateLineItemsStep } from "../steps"
import { validateVariantPricesStep } from "../steps/validate-variant-prices"
import {
  cartFieldsForPricingContext,
  cartFieldsForRefreshSteps,
  productVariantsFields,
} from "../utils/fields"
import { prepareLineItemData } from "../utils/prepare-line-item-data"
import { refreshCartShippingMethodsWorkflow } from "./refresh-cart-shipping-methods"
import { refreshPaymentCollectionForCartWorkflow } from "./refresh-payment-collection"
import { updateCartPromotionsWorkflow } from "./update-cart-promotions"
import { updateTaxLinesWorkflow } from "./update-tax-lines"

export const refreshCartItemsWorkflowId = "refresh-cart-items"
/**
 * This workflow refreshes a cart's items
 */
export const refreshCartItemsWorkflow = createWorkflow(
  refreshCartItemsWorkflowId,
  (
    input: WorkflowData<{
      cart_id: string
      promo_codes?: string[]
    }>
  ) => {
    const cart = useRemoteQueryStep({
      entry_point: "cart",
      fields: cartFieldsForRefreshSteps,
      variables: { id: input.cart_id },
      list: false,
    })

    const variantIds = transform({ cart }, (data) => {
      return (data.cart.items ?? []).map((i) => i.variant_id)
    })

    const cartPricingContext = transform({ cart }, ({ cart }) => {
      return filterObjectByKeys(cart, cartFieldsForPricingContext)
    })

    const variants = useRemoteQueryStep({
      entry_point: "variants",
      fields: productVariantsFields,
      variables: {
        id: variantIds,
        calculated_price: {
          context: cartPricingContext,
        },
      },
      throw_if_key_not_found: true,
    }).config({ name: "fetch-variants" })

    validateVariantPricesStep({ variants })

    const lineItems = transform({ cart, variants }, ({ cart, variants }) => {
      const items = cart.items.map((item) => {
        const variant = variants.find((v) => v.id === item.variant_id)!

        const preparedItem = prepareLineItemData({
          variant: variant,
          unitPrice: variant.calculated_price.calculated_amount,
          isTaxInclusive:
            variant.calculated_price.is_calculated_price_tax_inclusive,
          quantity: item.quantity,
          metadata: item.metadata,
          cartId: cart.id,
        })

        return {
          selector: { id: item.id },
          data: preparedItem,
        }
      })

      return items
    })

    updateLineItemsStep({
      id: cart.id,
      items: lineItems,
    })

    const refetchedCart = useRemoteQueryStep({
      entry_point: "cart",
      fields: cartFieldsForRefreshSteps,
      variables: { id: cart.id },
      list: false,
    }).config({ name: "refetch–cart" })

    refreshCartShippingMethodsWorkflow.runAsStep({
      input: { cart_id: cart.id },
    })

    updateTaxLinesWorkflow.runAsStep({
      input: { cart_id: cart.id },
    })

    const cartPromoCodes = transform(
      { refetchedCart, input },
      ({ refetchedCart, input }) => {
        if (isDefined(input.promo_codes)) {
          return input.promo_codes
        } else {
          return refetchedCart.promotions.map((p) => p?.code).filter(Boolean)
        }
      }
    )

    updateCartPromotionsWorkflow.runAsStep({
      input: {
        cart_id: cart.id,
        promo_codes: cartPromoCodes,
        action: PromotionActions.REPLACE,
      },
    })

    refreshPaymentCollectionForCartWorkflow.runAsStep({
      input: { cart_id: cart.id },
    })

    return new WorkflowResponse(refetchedCart)
  }
)
