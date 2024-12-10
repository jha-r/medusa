/**
 * @schema StorePrice
 * type: object
 * description: The price's prices.
 * x-schemaName: StorePrice
 * required:
 *   - id
 *   - currency_code
 *   - amount
 *   - min_quantity
 *   - max_quantity
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The price's ID.
 *   currency_code:
 *     type: string
 *     title: currency_code
 *     description: The price's currency code.
 *   amount:
 *     type: number
 *     title: amount
 *     description: The price's amount.
 *   min_quantity:
 *     type: number
 *     title: min_quantity
 *     description: The price's min quantity.
 *   max_quantity:
 *     type: number
 *     title: max_quantity
 *     description: The price's max quantity.
 *   price_rules:
 *     type: array
 *     description: The price's price rules.
 *     items:
 *       $ref: "#/components/schemas/StorePriceRule"
 * 
*/

