import { OrderDTO, OrderWorkflow } from "@medusajs/framework/types"
import {
  WorkflowData,
  WorkflowResponse,
  createStep,
  createWorkflow,
  transform,
  when,
} from "@medusajs/framework/workflows-sdk"
import { OrderPreviewDTO } from "@medusajs/types"

import { throwIfOrderIsCancelled } from "../utils/order-validation"
import { previewOrderChangeStep } from "../steps"
import { emitEventStep, useQueryGraphStep } from "../../common"
import { updateOrderShippingAddressWorkflow } from "./update-shipping-address"
import { OrderWorkflowEvents } from "@medusajs/framework/utils"

/**
 * This step validates that an order can be updated with provided input.
 */
export const updateOrderValidationStep = createStep(
  "update-order-validation",
  async function ({
    order,
    input,
  }: {
    order: OrderDTO
    input: OrderWorkflow.UpdateOrderWorkflowInput
  }) {
    throwIfOrderIsCancelled({ order })
  }
)

export const updateOrderWorkflowId = "update-order-workflow"
/**
 * Update order workflow.
 */
export const updateOrderWorkflow = createWorkflow(
  updateOrderWorkflowId,
  function (
    input: WorkflowData<OrderWorkflow.UpdateOrderWorkflowInput>
  ): WorkflowResponse<OrderPreviewDTO> {
    const orderQuery = useQueryGraphStep({
      entity: "order",
      fields: ["id", "status"],
      filters: { id: input.id },
      options: { throwIfKeyNotFound: true },
    }).config({ name: "order-query" })

    const order = transform(
      { orderQuery },
      ({ orderQuery }) => orderQuery.data[0]
    )

    updateOrderValidationStep({ order, input })

    when({ input }, ({ input }) => !!input.shipping_address).then(() => {
      updateOrderShippingAddressWorkflow.runAsStep({
        input: {
          order_id: input.id,
          shipping_address: input.shipping_address,
        },
      })
    })

    emitEventStep({
      eventName: OrderWorkflowEvents.UPDATED,
      data: { id: input.id },
    })

    return new WorkflowResponse(previewOrderChangeStep(input.id))
  }
)
