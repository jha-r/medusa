import {
  deepFlatMap,
  isDefined,
  isPresent,
  MedusaError,
} from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  when,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep, validatePresenceOfStep } from "../../common"
import { useRemoteQueryStep } from "../../common/steps/use-remote-query"

export const listShippingOptionsForCartWorkflowId =
  "list-shipping-options-for-cart"
/**
 * This workflow lists the shipping options of a cart.
 */
export const listShippingOptionsForCartWorkflow = createWorkflow(
  listShippingOptionsForCartWorkflowId,
  (
    input: WorkflowData<{
      cart_id: string
      option_ids?: string[]
      is_return?: boolean
      enabled_in_store?: boolean
      options?: {
        shouldValidatePrices?: boolean
      }
    }>
  ) => {
    const cartQuery = useQueryGraphStep({
      entity: "cart",
      filters: { id: input.cart_id },
      fields: [
        "id",
        "sales_channel_id",
        "currency_code",
        "region_id",
        "shipping_address.city",
        "shipping_address.country_code",
        "shipping_address.province",
        "shipping_address.postal_code",
        "item_total",
        "total",
      ],
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-cart" })

    const cart = transform({ cartQuery }, ({ cartQuery }) => cartQuery.data[0])

    validatePresenceOfStep({
      entity: cart,
      fields: ["sales_channel_id", "region_id", "currency_code"],
    })

    const scFulfillmentSetQuery = useQueryGraphStep({
      entity: "sales_channels",
      filters: { id: cart.sales_channel_id },
      fields: ["stock_locations.fulfillment_sets.id"],
    }).config({ name: "sales_channels-fulfillment-query" })

    const scFulfillmentSets = transform(
      { scFulfillmentSetQuery },
      ({ scFulfillmentSetQuery }) => scFulfillmentSetQuery.data[0]
    )

    const fulfillmentSetIds = transform(
      { options: scFulfillmentSets },
      (data) => {
        const fulfillmentSetIds = new Set<string>()

        deepFlatMap(
          data.options,
          "stock_locations.fulfillment_sets",
          ({ fulfillment_sets: fulfillmentSet }) => {
            if (fulfillmentSet?.id) {
              fulfillmentSetIds.add(fulfillmentSet.id)
            }
          }
        )

        return Array.from(fulfillmentSetIds)
      }
    )

    const customerGroupIds = when({ cart }, ({ cart }) => {
      return !!cart.customer_group_id
    }).then(() => {
      const customerQuery = useQueryGraphStep({
        entity: "customer",
        filters: { id: cart.customer_id },
        fields: ["groups.id"],
      }).config({ name: "get-customer" })

      return transform({ customerQuery }, ({ customerQuery }) => {
        const customer = customerQuery.data[0]

        if (!isPresent(customer)) {
          return []
        }

        const { groups = [] } = customer

        return groups.map((group) => group.id)
      })
    })

    const pricingContext = transform(
      { cart, customerGroupIds },
      ({ cart, customerGroupIds }) => {
        return {
          ...cart,
          customer_group_id: customerGroupIds,
        }
      }
    )

    const queryVariables = transform(
      { input, fulfillmentSetIds, cart, pricingContext },
      ({ input, fulfillmentSetIds, cart, pricingContext }) => {
        const test = {
          id: input.option_ids,

          context: {
            is_return: input.is_return ?? false,
            enabled_in_store: input.enabled_in_store ?? true,
          },

          filters: {
            fulfillment_set_id: fulfillmentSetIds,

            address: {
              country_code: cart.shipping_address?.country_code,
              province_code: cart.shipping_address?.province,
              city: cart.shipping_address?.city,
              postal_expression: cart.shipping_address?.postal_code,
            },
          },

          calculated_price: { context: pricingContext },
        }

        return test
      }
    )

    const shippingOptions = useRemoteQueryStep({
      entry_point: "shipping_options",
      fields: [
        "id",
        "name",
        "price_type",
        "service_zone_id",
        "shipping_profile_id",
        "provider_id",
        "data",

        "type.id",
        "type.label",
        "type.description",
        "type.code",

        "provider.id",
        "provider.is_enabled",

        "rules.attribute",
        "rules.value",
        "rules.operator",

        "calculated_price.*",
      ],
      variables: queryVariables,
    }).config({ name: "shipping-options-query" })

    const updatedShippingOptions = transform(
      { shippingOptions, input },
      ({ shippingOptions, input }) => {
        const optionsMissingPrices: string[] = []

        const options = shippingOptions.map((shippingOption) => {
          const { calculated_price, ...options } = shippingOption

          if (
            shippingOption?.id &&
            !isDefined(calculated_price?.calculated_amount)
          ) {
            optionsMissingPrices.push(options.id)
          }

          return {
            ...shippingOption,
            amount: calculated_price?.calculated_amount,
            is_tax_inclusive:
              !!calculated_price?.is_calculated_price_tax_inclusive,
          }
        })

        const shouldValidatePrices = input.options?.shouldValidatePrices ?? true

        if (optionsMissingPrices.length && shouldValidatePrices) {
          const ids = optionsMissingPrices.join(", ")

          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Shipping options with IDs ${ids} do not have a price`
          )
        }

        return options.filter((option) =>
          isDefined(option?.calculated_price?.calculated_amount)
        )
      }
    )

    return new WorkflowResponse(updatedShippingOptions)
  }
)
