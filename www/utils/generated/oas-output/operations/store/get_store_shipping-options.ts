/**
 * @oas [get] /store/shipping-options
 * operationId: GetShippingOptions
 * summary: List Shipping Options for Cart
 * description: |
 *   Retrieve a list of shipping options for a cart. The cart's ID is set in the required `cart_id` query parameter.
 * 
 *   The shipping options also be sorted or paginated.
 * externalDocs:
 *   url: https://docs.medusajs.com/v2/resources/storefront-development/checkout/shipping
 *   description: "Storefront guide: How to implement shipping during checkout."
 * x-authenticated: false
 * parameters:
 *   - name: cart_id
 *     in: query
 *     description: The ID of the cart to retrieve its shipping options.
 *     required: true
 *     schema:
 *       type: string
 *       title: cart_id
 *       description: The ID of the cart to retrieve its shipping options.
 *   - name: $and
 *     in: query
 *     description: Join query parameters with an AND condition. Each object's content is the same type as the expected query parameters.
 *     required: false
 *     schema:
 *       type: array
 *       description: Join query parameters with an AND condition. Each object's content is the same type as the expected query parameters.
 *       items:
 *         type: object
 *       title: $and
 *   - name: $or
 *     in: query
 *     description: Join query parameters with an OR condition. Each object's content is the same type as the expected query parameters.
 *     required: false
 *     schema:
 *       type: array
 *       description: Join query parameters with an OR condition. Each object's content is the same type as the expected query parameters.
 *       items:
 *         type: object
 *       title: $or
 *   - name: is_return
 *     in: query
 *     description: Whether the shipping option can be used for returns.
 *     required: false
 *     schema:
 *       type: boolean
 *       title: is_return
 *       description: Whether the shipping option can be used for returns.
 * x-codeSamples:
 *   - lang: Shell
 *     label: cURL
 *     source: |-
 *       curl '{backend_url}/store/shipping-options' \
 *       -H 'x-publishable-api-key: {your_publishable_api_key}'
 * tags:
 *   - Shipping Options
 * responses:
 *   "200":
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/StoreShippingOptionListResponse"
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
 * x-workflow: listShippingOptionsForCartWorkflow
 * 
*/

