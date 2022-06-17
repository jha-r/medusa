import { CustomerGroupService } from "../../../../services"
import { FindParams } from "../../../../types/common"

/**
 * @oas [get] /customer-groups/{id}
 * operationId: "GetCustomerGroupsGroup"
 * summary: "Retrieve a CustomerGroup"
 * description: "Retrieves a Customer Group."
 * x-authenticated: true
 * parameters:
 *   - (path) id=* {string} The id of the Customer Group.
 * tags:
 *   - CustomerGroup
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           properties:
 *             customer_group:
 *               $ref: "#/components/schemas/customer_group"
 */
export default async (req, res) => {
  const { id } = req.params

  const customerGroupService: CustomerGroupService = req.scope.resolve(
    "customerGroupService"
  )

  const customerGroup = await customerGroupService.retrieve(
    id,
    req.retrieveConfig
  )

  res.json({ customer_group: customerGroup })
}

export class AdminGetCustomerGroupsGroupParams extends FindParams {}
