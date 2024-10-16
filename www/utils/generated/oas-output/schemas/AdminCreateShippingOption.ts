/**
 * @schema AdminCreateShippingOption
 * type: object
 * description: The shipping option's details.
 * x-schemaName: AdminCreateShippingOption
 * required:
 *   - name
 *   - service_zone_id
 *   - shipping_profile_id
 *   - price_type
 *   - provider_id
 *   - type
 *   - prices
 * properties:
 *   name:
 *     type: string
 *     title: name
 *     description: The shipping option's name.
 *   service_zone_id:
 *     type: string
 *     title: service_zone_id
 *     description: The ID of the associated service zone.
 *   shipping_profile_id:
 *     type: string
 *     title: shipping_profile_id
 *     description: The ID of the shipping profile that the option belongs to.
 *   data:
 *     type: object
 *     description: Data useful for the fulfillment provider handling the processing of this shipping option.
 *     externalDocs:
 *       url: https://docs.medusajs.com/v2/resources/commerce-modules/fulfillment/shipping-option#data-property
 *   price_type:
 *     type: string
 *     description: The type of the shipping option's price. If `flat`, the shipping option's price is in the `prices` field. If `calculated`, it will be calculated by the fulfillment provider duing checkout.
 *     enum:
 *       - flat
 *       - calculated
 *   provider_id:
 *     type: string
 *     title: provider_id
 *     description: The ID of the associated fulfillment provider.
 *   type:
 *     $ref: "#/components/schemas/AdminCreateShippingOptionType"
 *   prices:
 *     type: array
 *     description: The shipping option's prices if its `price_type` is flat.
 *     items:
 *       oneOf:
 *         - type: object
 *           description: A shipping option price.
 *           x-schemaName: AdminCreateShippingOptionPriceWithCurrency
 *           required:
 *             - currency_code
 *             - amount
 *           properties:
 *             currency_code:
 *               type: string
 *               title: currency_code
 *               description: The price's currency code.
 *               example: usd
 *             amount:
 *               type: number
 *               title: amount
 *               description: The price's amount.
 *         - type: object
 *           description: A shipping option price.
 *           x-schemaName: AdminCreateShippingOptionPriceWithRegion
 *           required:
 *             - region_id
 *             - amount
 *           properties:
 *             region_id:
 *               type: string
 *               title: region_id
 *               description: The ID of the region this price is used in.
 *             amount:
 *               type: number
 *               title: amount
 *               description: The price's amount.
 *   rules:
 *     type: array
 *     description: The shipping option's rules.
 *     items:
 *       $ref: "#/components/schemas/AdminCreateShippingOptionRule"
 * 
*/

