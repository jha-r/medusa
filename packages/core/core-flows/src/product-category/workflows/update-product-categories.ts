import { ProductCategoryWorkflow } from "@medusajs/framework/types"
import { ProductCategoryWorkflowEvents } from "@medusajs/framework/utils"
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
  createHook,
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "../../common"
import { updateProductCategoriesStep } from "../steps"

export const updateProductCategoriesWorkflowId = "update-product-categories"
/**
 * This workflow updates product categories matching specified filters.
 */
export const updateProductCategoriesWorkflow = createWorkflow(
  updateProductCategoriesWorkflowId,
  (
    input: WorkflowData<ProductCategoryWorkflow.UpdateProductCategoriesWorkflowInput>
  ) => {
    const updatedCategories = updateProductCategoriesStep(input)

    const productCategoryIdEvents = transform(
      { updatedCategories },
      ({ updatedCategories }) => {
        const arr = Array.isArray(updatedCategories)
          ? updatedCategories
          : [updatedCategories]

        return arr?.map((v) => {
          return { id: v.id }
        })
      }
    )

    emitEventStep({
      eventName: ProductCategoryWorkflowEvents.UPDATED,
      data: productCategoryIdEvents,
    })

    const categoriesUpdated = createHook("categoriesUpdated", {
      categories: updatedCategories
    })

    return new WorkflowResponse(updatedCategories, {
      hooks: [categoriesUpdated]
    })
  }
)
