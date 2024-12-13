import { ProductCategoryWorkflow } from "@medusajs/framework/types"
import { ProductCategoryWorkflowEvents } from "@medusajs/framework/utils"
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
  transform,
  createHook
} from "@medusajs/framework/workflows-sdk"
import { emitEventStep } from "../../common"
import { createProductCategoriesStep } from "../steps"

export const createProductCategoriesWorkflowId = "create-product-categories"
/**
 * This workflow creates one or more product categories.
 */
export const createProductCategoriesWorkflow = createWorkflow(
  createProductCategoriesWorkflowId,
  (
    input: WorkflowData<ProductCategoryWorkflow.CreateProductCategoriesWorkflowInput>
  ) => {
    const createdCategories = createProductCategoriesStep(input)

    const productCategoryIdEvents = transform(
      { createdCategories },
      ({ createdCategories }) => {
        return createdCategories.map((v) => {
          return { id: v.id }
        })
      }
    )

    emitEventStep({
      eventName: ProductCategoryWorkflowEvents.CREATED,
      data: productCategoryIdEvents,
    })

    const categoriesCreated = createHook("categoriesCreated", {
      categories: createdCategories
    })

    return new WorkflowResponse(createdCategories, {
      hooks: [categoriesCreated]
    })
  }
)
