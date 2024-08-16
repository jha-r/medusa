/**
 * @oas [post] /admin/products/{id}/variants/{variant_id}
 * operationId: PostProductsIdVariantsVariant_id
 * summary: Add Variants to Product
 * description: Add a list of variants to a product.
 * x-authenticated: true
 * parameters:
 *   - name: id
 *     in: path
 *     description: The product's ID.
 *     required: true
 *     schema:
 *       type: string
 *   - name: variant_id
 *     in: path
 *     description: The product's variant id.
 *     required: true
 *     schema:
 *       type: string
 *   - name: expand
 *     in: query
 *     description: Comma-separated relations that should be expanded in the returned data.
 *     required: false
 *     schema:
 *       type: string
 *       title: expand
 *       description: Comma-separated relations that should be expanded in the returned data.
 *   - name: fields
 *     in: query
 *     description: Comma-separated fields that should be included in the returned
 *       data. if a field is prefixed with `+` it will be added to the default
 *       fields, using `-` will remove it from the default fields. without prefix
 *       it will replace the entire default fields.
 *     required: false
 *     schema:
 *       type: string
 *       title: fields
 *       description: Comma-separated fields that should be included in the returned
 *         data. if a field is prefixed with `+` it will be added to the default
 *         fields, using `-` will remove it from the default fields. without prefix
 *         it will replace the entire default fields.
 *   - name: offset
 *     in: query
 *     description: The number of items to skip when retrieving a list.
 *     required: false
 *     schema:
 *       type: number
 *       title: offset
 *       description: The number of items to skip when retrieving a list.
 *   - name: limit
 *     in: query
 *     description: Limit the number of items returned in the list.
 *     required: false
 *     schema:
 *       type: number
 *       title: limit
 *       description: Limit the number of items returned in the list.
 *   - name: order
 *     in: query
 *     description: The field to sort the data by. By default, the sort order is
 *       ascending. To change the order to descending, prefix the field name with
 *       `-`.
 *     required: false
 *     schema:
 *       type: string
 *       title: order
 *       description: The field to sort the data by. By default, the sort order is
 *         ascending. To change the order to descending, prefix the field name with
 *         `-`.
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 *   - jwt_token: []
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         description: SUMMARY
 *         properties:
 *           title:
 *             type: string
 *             title: title
 *             description: The product's title.
 *           sku:
 *             type: string
 *             title: sku
 *             description: The product's sku.
 *           ean:
 *             type: string
 *             title: ean
 *             description: The product's ean.
 *           upc:
 *             type: string
 *             title: upc
 *             description: The product's upc.
 *           barcode:
 *             type: string
 *             title: barcode
 *             description: The product's barcode.
 *           hs_code:
 *             type: string
 *             title: hs_code
 *             description: The product's hs code.
 *           mid_code:
 *             type: string
 *             title: mid_code
 *             description: The product's mid code.
 *           allow_backorder:
 *             type: boolean
 *             title: allow_backorder
 *             description: The product's allow backorder.
 *           manage_inventory:
 *             type: boolean
 *             title: manage_inventory
 *             description: The product's manage inventory.
 *           variant_rank:
 *             type: number
 *             title: variant_rank
 *             description: The product's variant rank.
 *           weight:
 *             type: number
 *             title: weight
 *             description: The product's weight.
 *           length:
 *             type: number
 *             title: length
 *             description: The product's length.
 *           height:
 *             type: number
 *             title: height
 *             description: The product's height.
 *           width:
 *             type: number
 *             title: width
 *             description: The product's width.
 *           origin_country:
 *             type: string
 *             title: origin_country
 *             description: The product's origin country.
 *           material:
 *             type: string
 *             title: material
 *             description: The product's material.
 *           metadata:
 *             type: object
 *             description: The product's metadata.
 *           prices:
 *             type: array
 *             description: The product's prices.
 *             items:
 *               $ref: "#/components/schemas/AdminCreateProductVariantPrice"
 *           options:
 *             type: object
 *             description: The product's options.
 * x-codeSamples:
 *   - lang: Shell
 *     label: cURL
 *     source: |-
 *       curl -X POST '{backend_url}/admin/products/{id}/variants/{variant_id}' \
 *       -H 'x-medusa-access-token: {api_token}'
 * tags:
 *   - Products
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/AdminProductResponse"
 *   "400":
 *     $ref: "#/components/responses/400_error"
 *   "401":
 *     $ref: "#/components/responses/unauthorized"
 *   "404":
 *     $ref: "#/components/responses/not_found_error"
 *   "409":
 *     $ref: "#/components/responses/invalid_state_error"
 *   "422":
 *     $ref: "#/components/responses/invalid_request_error"
 *   "500":
 *     $ref: "#/components/responses/500_error"
 * 
*/

