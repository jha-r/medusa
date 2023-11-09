import CustomerService from "../../../../services/customer"
import { FindParams } from "../../../../types/common"
import { defaultAdminCustomersRelations } from "."
import { validator } from "../../../../utils/validator"

/**
 * @oas [get] /admin/customers/{id}
 * operationId: "GetCustomersCustomer"
 * summary: "Get a Customer"
 * description: "Retrieve the details of a customer."
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The ID of the Customer.
 *   - (query) expand {string} Comma-separated relations that should be expanded in the returned customer.
 *   - (query) fields {string} Comma-separated fields that should be included in the returned customer.
 * x-codegen:
 *   method: retrieve
 * x-codeSamples:
 *   - lang: JavaScript
 *     label: JS Client
 *     source: |
 *       import Medusa from "@medusajs/medusa-js"
 *       const medusa = new Medusa({ baseUrl: MEDUSA_BACKEND_URL, maxRetries: 3 })
 *       // must be previously logged in or use api token
 *       medusa.admin.customers.retrieve(customerId)
 *       .then(({ customer }) => {
 *         console.log(customer.id);
 *       })
 *   - lang: Shell
 *     label: cURL
 *     source: |
 *       curl '{backend_url}/admin/customers/{id}' \
 *       -H 'x-medusa-access-token: {api_token}'
 * security:
 *   - api_token: []
 *   - cookie_auth: []
 *   - jwt_token: []
 * tags:
 *   - Customers
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           $ref: "#/components/schemas/AdminCustomersRes"
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
 */
export default async (req, res) => {
  const { id } = req.params

  const validated = await validator(FindParams, req.query)

  const customerService: CustomerService = req.scope.resolve("customerService")

  let expandFields: string[] = []
  if (validated.expand) {
    expandFields = validated.expand.split(",")
  }

  const findConfig = {
    relations: expandFields.length
      ? expandFields
      : defaultAdminCustomersRelations,
  }

  const customer = await customerService.retrieve(id, findConfig)

  res.json({ customer })
}
