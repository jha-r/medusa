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
import { deleteOrderChangesStep } from "../../steps"
import {
  throwIfIsCancelled,
  throwIfOrderChangeIsNotActive,
} from "../../utils/order-validation"

/**
 * This step validates that a requested order transfer can be canceled.
 */
export const cancelTransferOrderRequestValidationStep = createStep(
  "validate-cancel-transfer-order-request",
  async function ({
    order,
    orderChange,
    input,
  }: {
    order: OrderDTO
    orderChange: OrderChangeDTO
    input: OrderWorkflow.CancelTransferOrderRequestWorkflowInput
  }) {
    throwIfIsCancelled(order, "Order")
    throwIfOrderChangeIsNotActive({ orderChange })

    if (input.logged_in_user_id.startsWith("user_")) {
      return
    }

    const action = orderChange.actions?.find(
      (a) => a.action === ChangeActionType.TRANSFER_CUSTOMER
    )

    if (action?.reference_id !== input.logged_in_user_id) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "This customer is not allowed to cancel the transfer."
      )
    }
  }
)

export const cancelTransferOrderRequestWorkflowId =
  "cancel-transfer-order-request"
/**
 * This workflow cancels a requested order transfer.
 *
 * Customer that requested the transfer or a store admin are allowed to cancel the order transfer request.
 */
export const cancelOrderTransferRequestWorkflow = createWorkflow(
  cancelTransferOrderRequestWorkflowId,
  function (
    input: WorkflowData<OrderWorkflow.CancelTransferOrderRequestWorkflowInput>
  ): WorkflowData<void> {
    const order: OrderDTO = useRemoteQueryStep({
      entry_point: "orders",
      fields: ["id", "version", "canceled_at"],
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

    cancelTransferOrderRequestValidationStep({ order, orderChange, input })

    deleteOrderChangesStep({ ids: [orderChange.id] })
  }
)
