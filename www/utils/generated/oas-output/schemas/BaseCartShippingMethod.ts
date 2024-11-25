/**
 * @schema BaseCartShippingMethod
 * type: object
 * description: The tax line's shipping method.
 * x-schemaName: BaseCartShippingMethod
 * required:
 *   - id
 *   - cart_id
 *   - name
 *   - amount
 *   - is_tax_inclusive
 *   - created_at
 *   - updated_at
 *   - original_total
 *   - original_subtotal
 *   - original_tax_total
 *   - total
 *   - subtotal
 *   - tax_total
 *   - discount_total
 *   - discount_tax_total
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The shipping method's ID.
 *   cart_id:
 *     type: string
 *     title: cart_id
 *     description: The shipping method's cart id.
 *   name:
 *     type: string
 *     title: name
 *     description: The shipping method's name.
 *   description:
 *     type: string
 *     title: description
 *     description: The shipping method's description.
 *   amount:
 *     type: number
 *     title: amount
 *     description: The shipping method's amount.
 *   is_tax_inclusive:
 *     type: boolean
 *     title: is_tax_inclusive
 *     description: The shipping method's is tax inclusive.
 *   shipping_option_id:
 *     type: string
 *     title: shipping_option_id
 *     description: The shipping method's shipping option id.
 *   data:
 *     type: object
 *     description: The shipping method's data.
 *   metadata:
 *     type: object
 *     description: The shipping method's metadata.
 *   tax_lines:
 *     type: array
 *     description: The shipping method's tax lines.
 *     items:
 *       $ref: "#/components/schemas/BaseShippingMethodTaxLine"
 *   adjustments:
 *     type: array
 *     description: The shipping method's adjustments.
 *     items:
 *       $ref: "#/components/schemas/BaseShippingMethodAdjustment"
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The shipping method's created at.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The shipping method's updated at.
 *   original_total:
 *     type: number
 *     title: original_total
 *     description: The shipping method's original total.
 *   original_subtotal:
 *     type: number
 *     title: original_subtotal
 *     description: The shipping method's original subtotal.
 *   original_tax_total:
 *     type: number
 *     title: original_tax_total
 *     description: The shipping method's original tax total.
 *   total:
 *     type: number
 *     title: total
 *     description: The shipping method's total.
 *   subtotal:
 *     type: number
 *     title: subtotal
 *     description: The shipping method's subtotal.
 *   tax_total:
 *     type: number
 *     title: tax_total
 *     description: The shipping method's tax total.
 *   discount_total:
 *     type: number
 *     title: discount_total
 *     description: The shipping method's discount total.
 *   discount_tax_total:
 *     type: number
 *     title: discount_tax_total
 *     description: The shipping method's discount tax total.
 * 
*/

