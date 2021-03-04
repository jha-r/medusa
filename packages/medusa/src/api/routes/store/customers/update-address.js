import { Validator, MedusaError } from "medusa-core-utils"

/**
 * @oas [post] /customers/{id}/addresses/{address_id}
 * operationId: PostCustomersCustomerAddressesAddress
 * summary: "Update a Shipping Address"
 * description: "Updates a Customer's saved Shipping Address."
 * parameters:
 *   - (path) id=* {String} The Customer id.
 *   - (path) address_id=* {String} The id of the Address to update.
 * requestBody:
 *   content:
 *     application/json:
 *       schema:
 *         properties:
 *           address:
 *             description: "The updated Address."
 *             anyOf:
 *               - $ref: "#/components/schemas/address"
 * tags:
 *   - customer
 * responses:
 *  "200":
 *    description: OK
 *    content:
 *      application/json:
 *        schema:
 *          properties:
 *            customer:
 *              $ref: "#/components/schemas/customer"
 */
export default async (req, res) => {
  const { id, address_id } = req.params

  const schema = Validator.object().keys({
    address: Validator.address().required(),
  })

  const { value, error } = schema.validate(req.body)
  if (error) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, error.details)
  }

  const customerService = req.scope.resolve("customerService")
  try {
    let customer = await customerService.updateAddress(
      id,
      address_id,
      value.address
    )

    customer = await customerService.retrieve(id, {
      relations: ["shipping_addresses"],
    })

    res.json({ customer })
  } catch (err) {
    throw err
  }
}
