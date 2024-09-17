/**
 * @schema AdminPostExchangesAddItemsReqSchema
 * type: object
 * description: The details of outbound items.
 * x-schemaName: AdminPostExchangesAddItemsReqSchema
 * properties:
 *   items:
 *     type: array
 *     description: The details of outbound items.
 *     items:
 *       type: object
 *       description: An item's details.
 *       required:
 *         - variant_id
 *         - quantity
 *       properties:
 *         variant_id:
 *           type: string
 *           title: variant_id
 *           description: The ID of the associated product variant.
 *         quantity:
 *           type: number
 *           title: quantity
 *           description: The item's quantity.
 *         unit_price:
 *           type: number
 *           title: unit_price
 *           description: The item's unit price.
 *         internal_note:
 *           type: string
 *           title: internal_note
 *           description: A note viewed only by admin users.
 *         allow_backorder:
 *           type: boolean
 *           title: allow_backorder
 *           description: Whether the item can be added even if it's not in stock.
 *         metadata:
 *           type: object
 *           description: The item's metadata, can hold custom key-value pairs.
 * 
*/

