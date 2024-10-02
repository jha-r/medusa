/**
 * @schema AdminCreateProductVariantInventoryKit
 * type: object
 * description: The details of a variant's inventory item.
 * x-schemaName: AdminCreateProductVariantInventoryKit
 * required:
 *   - inventory_item_id
 * properties:
 *   inventory_item_id:
 *     type: string
 *     title: inventory_item_id
 *     description: The inventory item's ID.
 *   required_quantity:
 *     type: number
 *     title: required_quantity
 *     description: The number of units a single quantity is equivalent to. For example, if a customer orders one quantity of the variant, Medusa checks the availability of the quantity multiplied by the
 *       value set for `required_quantity`. When the customer orders the quantity, Medusa reserves the ordered quantity multiplied by the value set for `required_quantity`.
 * 
*/

