import { MedusaError } from "medusa-core-utils"

/**
 * @oas [post] /{id}/fulfillments/{fulfillment_id}/cancel
 * operationId: "PostOrdersOrderFulfillmentsCancel"
 * summary: "Cancels a fulfilmment"
 * description: "Registers a Fulfillment as canceled."
 * parameters:
 *   - (path) id=* {string} The id of the Order which the Fulfillment relates to.
 *   - (path) fulfillment_id=* {string} The id of the Fulfillment
 * tags:
 *   - Fulfillment
 * responses:
 *   200:
 *     description: OK
 *     content:
 *       application/json:
 *         schema:
 *           properties:
 *             order:
 *               $ref: "#/components/schemas/order"
 *             fulfillment:
 *               $ref: "#/components/schemas/fulfillment"
 */
export default async (req, res) => {
  const { id, fulfillment_id } = req.params

  try {
    const fulfillmentService = req.scope.resolve("fulfillmentService")

    const fulfillment = await fulfillmentService.retrieve(fulfillment_id)

    if (fulfillment.order_id !== id) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `no fulfillment was found with the id: ${fulfillment_id} related to order: ${id}`
      )
    }

    await fulfillmentService.cancel(fulfillment_id)

    const result = await fulfillmentService.retrieve(fulfillment_id)

    res.json({ result })
  } catch (error) {
    throw error
  }
}
