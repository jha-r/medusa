import {
  OrderChangeDTO,
  OrderDTO,
  OrderWorkflow,
} from "@medusajs/framework/types"
import {
  ChangeActionType,
  MedusaError,
  OrderChangeStatus,
} from "@medusajs/framework/utils"
import {
  WorkflowData,
  createStep,
  createWorkflow,
} from "@medusajs/framework/workflows-sdk"

import { useRemoteQueryStep } from "../../../common"
import { declineOrderChangeStep } from "../../steps"
import {
  throwIfIsCancelled,
  throwIfOrderChangeIsNotActive,
} from "../../utils/order-validation"

/**
 * This step validates that a requested order transfer can be declineed.
 */
export const declineTransferOrderRequestValidationStep = createStep(
  "validate-decline-transfer-order-request",
  async function ({
    order,
    orderChange,
    input,
  }: {
    order: OrderDTO
    orderChange: OrderChangeDTO
    input: OrderWorkflow.DeclineTransferOrderRequestWorkflowInput
  }) {
    throwIfIsCancelled(order, "Order")
    throwIfOrderChangeIsNotActive({ orderChange })

    const token = orderChange.actions?.find(
      (a) => a.action === ChangeActionType.TRANSFER_CUSTOMER
    )?.details!.token

    if (!input.token.length || token !== input.token) {
      throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Invalid token.")
    }
  }
)

export const declineTransferOrderRequestWorkflowId =
  "decline-transfer-order-request"
/**
 * This workflow declines a requested order transfer.
 *
 * Only the original customer (who has the token) is allowed to decline the transfer.
 */
export const declineOrderTransferRequestWorkflow = createWorkflow(
  declineTransferOrderRequestWorkflowId,
  function (
    input: WorkflowData<OrderWorkflow.DeclineTransferOrderRequestWorkflowInput>
  ): WorkflowData<void> {
    const order: OrderDTO = useRemoteQueryStep({
      entry_point: "orders",
      fields: ["id", "version", "declineed_at"],
      variables: { id: input.order_id },
      list: false,
      throw_if_key_not_found: true,
    }).config({ name: "order-query" })

    const orderChange: OrderChangeDTO = useRemoteQueryStep({
      entry_point: "order_change",
      fields: ["id", "status", "version", "actions.*"],
      variables: {
        filters: {
          order_id: input.order_id,
          status: [OrderChangeStatus.PENDING, OrderChangeStatus.REQUESTED],
        },
      },
      list: false,
    }).config({ name: "order-change-query" })

    declineTransferOrderRequestValidationStep({ order, orderChange, input })

    declineOrderChangeStep({ id: orderChange.id })
  }
)
