import { deepFlatMap, ShippingOptionPriceType } from "@medusajs/framework/utils"
import {
  createWorkflow,
  parallelize,
  transform,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { useQueryGraphStep, validatePresenceOfStep } from "../../common"
import { useRemoteQueryStep } from "../../common/steps/use-remote-query"
import { calculateShippingOptionsPricesStep } from "../../fulfillment"
import { CalculateShippingOptionPriceDTO } from "@medusajs/types"

const COMMON_OPTIONS_FIELDS = [
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
]

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
      options?: { id: string; data?: Record<string, unknown> }[]
      is_return?: boolean
      enabled_in_store?: boolean
    }>
  ) => {
    const optionIds = transform({ input }, ({ input }) =>
      (input.options || [])?.map(({ id }) => id)
    )

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

    const shippingOptionsQuery = useQueryGraphStep({
      entity: "shipping_options",
      filters: { id: optionIds },
      fields: ["id", "price_type"],
    }).config({ name: "shipping-options-price-type-query" })

    const optionPriceTypeMap = transform(
      { shippingOptionsQuery },
      ({ shippingOptionsQuery }) => {
        return new Map(
          shippingOptionsQuery.data.map((shippingOption) => [
            shippingOption.id,
            shippingOption.price_type,
          ])
        )
      }
    )

    const [flatRateOptionsQuery, calculatedShippingOptionsQuery] = transform(
      { input, fulfillmentSetIds, cart, optionPriceTypeMap, optionIds },
      ({ input, fulfillmentSetIds, cart, optionPriceTypeMap, optionIds }) => {
        // TODO: one pass
        const flatRateShippingOptionIds = optionIds.filter(
          (option_id) =>
            optionPriceTypeMap.get(option_id) === ShippingOptionPriceType.FLAT
        )

        const calculatedShippingOptionIds = optionIds.filter(
          (option_id) =>
            optionPriceTypeMap.get(option_id) ===
            ShippingOptionPriceType.CALCULATED
        )

        const commonOptions = {
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
        }

        return [
          {
            ...commonOptions,
            ids: flatRateShippingOptionIds,
            calculated_price: { context: cart },
          },
          {
            ...commonOptions,
            ids: calculatedShippingOptionIds,
          },
        ]
      }
    )

    const [shippingOptionsFlatRate, shippingOptionsCalculated] = parallelize(
      useRemoteQueryStep({
        entry_point: "shipping_options",
        fields: [
          ...COMMON_OPTIONS_FIELDS,
          "calculated_price.*",
          "prices.*",
          "prices.price_rules.*",
        ],
        variables: flatRateOptionsQuery,
      }).config({ name: "shipping-options-query-flat-rate" }),
      useRemoteQueryStep({
        entry_point: "shipping_options",
        fields: [...COMMON_OPTIONS_FIELDS],
        variables: calculatedShippingOptionsQuery,
      }).config({ name: "shipping-options-query-calculated" })
    )

    const calculateShippingOptionsPricesData = transform(
      { shippingOptionsCalculated, cart },
      ({ shippingOptionsCalculated, cart }) => {
        const optionDataMap = new Map(
          (input.options || [])?.map(({ id, data }) => [id, data])
        )

        return shippingOptionsCalculated.map(
          (so) =>
            ({
              id: so.id as string,
              optionData: so.data,
              context: {
                cart,
              },
              data: optionDataMap.get(so.id),
              provider_id: so.provider_id,
            } as CalculateShippingOptionPriceDTO)
        )
      }
    )

    const prices = calculateShippingOptionsPricesStep(
      calculateShippingOptionsPricesData
    )

    const shippingOptionsWithPrice = transform(
      { shippingOptionsFlatRate, shippingOptionsCalculated, prices, input },
      ({ shippingOptionsFlatRate, shippingOptionsCalculated, input }) => {
        return [
          ...shippingOptionsFlatRate.map((shippingOption) => {
            const price = shippingOption.calculated_price

            return {
              ...shippingOption,
              amount: price?.calculated_amount,
              is_tax_inclusive: !!price?.is_calculated_price_tax_inclusive,
            }
          }),
          ...shippingOptionsCalculated.map((shippingOption, index) => {
            return {
              ...shippingOption,
              amount: prices[index]?.calculated_amount,
              is_tax_inclusive:
                prices[index]?.is_calculated_price_tax_inclusive,
            }
          }),
        ]
      }
    )

    return new WorkflowResponse(shippingOptionsWithPrice)
  }
)
