import {
  createWorkflow,
  parallelize,
  transform,
  WorkflowData,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { BatchWorkflowInput, InventoryTypes } from "@medusajs/types"
import { createInventoryLevelsStep, updateInventoryLevelsStep } from "../steps"
import { deleteInventoryLevelsWorkflow } from "./delete-inventory-levels"

export interface BatchInventoryItemLevelsWorkflowInput
  extends BatchWorkflowInput<
    InventoryTypes.CreateInventoryLevelInput,
    InventoryTypes.UpdateInventoryLevelInput
  > {
  /**
   * If true, the workflow will force deletion of the inventory levels, even
   * if they have a non-zero stocked quantity. It false, the workflow will
   * not delete the inventory levels if they have a non-zero stocked quantity.
   *
   * Inventory levels that have reserved or incoming items at the location
   * will not be deleted even if the force flag is set to true.
   *
   * @default false
   */
  force?: boolean
}

export const batchInventoryItemLevelsWorkflowId =
  "batch-inventory-item-levels-workflow"

export const batchInventoryItemLevelsWorkflow = createWorkflow(
  batchInventoryItemLevelsWorkflowId,
  (input: WorkflowData<BatchInventoryItemLevelsWorkflowInput>) => {
    const res = parallelize(
      createInventoryLevelsStep(input.create ?? []),
      updateInventoryLevelsStep(input.update ?? []),
      deleteInventoryLevelsWorkflow.runAsStep({
        input: {
          id: input.delete ?? [],
          force: input.force ?? false,
        },
      })
    )

    return new WorkflowResponse(
      transform({ res, input }, (data) => {
        return {
          created: data.res[0],
          updated: data.res[1],
          deleted: data.input.delete,
        }
      })
    )
  }
)
