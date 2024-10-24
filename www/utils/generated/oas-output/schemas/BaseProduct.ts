/**
 * @schema BaseProduct
 * type: object
 * description: The product's details.
 * x-schemaName: BaseProduct
 * required:
 *   - id
 *   - title
 *   - handle
 *   - subtitle
 *   - description
 *   - is_giftcard
 *   - status
 *   - thumbnail
 *   - width
 *   - weight
 *   - length
 *   - height
 *   - origin_country
 *   - hs_code
 *   - mid_code
 *   - material
 *   - collection_id
 *   - type_id
 *   - variants
 *   - options
 *   - images
 *   - discountable
 *   - external_id
 *   - created_at
 *   - updated_at
 *   - deleted_at
 * properties:
 *   id:
 *     type: string
 *     title: id
 *     description: The product's ID.
 *   title:
 *     type: string
 *     title: title
 *     description: The product's title.
 *   handle:
 *     type: string
 *     title: handle
 *     description: The product's handle.
 *   subtitle:
 *     type: string
 *     title: subtitle
 *     description: The product's subtitle.
 *   description:
 *     type: string
 *     title: description
 *     description: The product's description.
 *   is_giftcard:
 *     type: boolean
 *     title: is_giftcard
 *     description: Whether the product is a gift card.
 *   status:
 *     type: string
 *     description: The product's status.
 *     enum:
 *       - draft
 *       - proposed
 *       - published
 *       - rejected
 *   thumbnail:
 *     type: string
 *     title: thumbnail
 *     description: The product's thumbnail URL.
 *   width:
 *     type: number
 *     title: width
 *     description: The product's width.
 *   weight:
 *     type: number
 *     title: weight
 *     description: The product's weight.
 *   length:
 *     type: number
 *     title: length
 *     description: The product's length.
 *   height:
 *     type: number
 *     title: height
 *     description: The product's height.
 *   origin_country:
 *     type: string
 *     title: origin_country
 *     description: The product's origin country.
 *   hs_code:
 *     type: string
 *     title: hs_code
 *     description: The product's hs code.
 *   mid_code:
 *     type: string
 *     title: mid_code
 *     description: The product's mid code.
 *   material:
 *     type: string
 *     title: material
 *     description: The product's material.
 *   collection:
 *     $ref: "#/components/schemas/BaseCollection"
 *   collection_id:
 *     type: string
 *     title: collection_id
 *     description: The ID of the collection the product belongs to.
 *   categories:
 *     type: array
 *     description: The product's categories.
 *     items:
 *       $ref: "#/components/schemas/BaseProductCategory"
 *   type:
 *     $ref: "#/components/schemas/BaseProductType"
 *   type_id:
 *     type: string
 *     title: type_id
 *     description: The ID of the type the product belongs to.
 *   tags:
 *     type: array
 *     description: The product's tags.
 *     items:
 *       $ref: "#/components/schemas/BaseProductTag"
 *   variants:
 *     type: array
 *     description: The product's variants.
 *     items:
 *       $ref: "#/components/schemas/BaseProductVariant"
 *   options:
 *     type: array
 *     description: The product's options.
 *     items:
 *       $ref: "#/components/schemas/BaseProductOption"
 *   images:
 *     type: array
 *     description: The product's images.
 *     items:
 *       $ref: "#/components/schemas/BaseProductImage"
 *   discountable:
 *     type: boolean
 *     title: discountable
 *     description: Whether the product is discountable.
 *   external_id:
 *     type: string
 *     title: external_id
 *     description: The ID of the product in an external or third-party system.
 *   created_at:
 *     type: string
 *     format: date-time
 *     title: created_at
 *     description: The date the product was created.
 *   updated_at:
 *     type: string
 *     format: date-time
 *     title: updated_at
 *     description: The date the product was updated.
 *   deleted_at:
 *     type: string
 *     format: date-time
 *     title: deleted_at
 *     description: The date the product was deleted.
 *   metadata:
 *     type: object
 *     description: The product's metadata, can hold custom key-value pairs.
 * 
*/

