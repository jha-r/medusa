import { WorkflowTypes } from "@medusajs/types"
import {
  TransactionStepsDefinition,
  WorkflowManager,
} from "@medusajs/orchestration"
import { exportWorkflow, pipe } from "../../helper"

import { PriceListHandlers } from "../../handlers"
import { Workflows } from "../../definitions"

export enum RemoveProductPricesActions {
  prepare = "prepare",
  removePriceListPriceSetPrices = "removePriceListPriceSetPrices",
}

const workflowSteps: TransactionStepsDefinition = {
  next: {
    action: RemoveProductPricesActions.prepare,
    noCompensation: true,
    next: {
      action: RemoveProductPricesActions.removePriceListPriceSetPrices,
      noCompensation: true,
    },
  },
}

const handlers = new Map([
  [
    RemoveProductPricesActions.prepare,
    {
      invoke: pipe(
        {
          inputAlias: RemoveProductPricesActions.prepare,
          merge: true,
          invoke: {
            from: RemoveProductPricesActions.prepare,
          },
        },
        PriceListHandlers.prepareRemoveProductPrices
      ),
    },
  ],
  [
    RemoveProductPricesActions.removePriceListPriceSetPrices,
    {
      invoke: pipe(
        {
          merge: true,
          invoke: {
            from: RemoveProductPricesActions.prepare,
            alias: PriceListHandlers.createPriceLists.aliases.priceLists,
          },
        },
        PriceListHandlers.removePriceListPriceSetPrices
      ),
    },
  ],
])

WorkflowManager.register(
  Workflows.RemovePriceListProductPrices,
  workflowSteps,
  handlers
)

export const removePriceListProductPrices = exportWorkflow<
  WorkflowTypes.PriceListWorkflow.RemovePriceListProductsWorkflowInputDTO,
  string[]
>(
  Workflows.RemovePriceListProductPrices,
  RemoveProductPricesActions.removePriceListPriceSetPrices,
  async (data) => data
)
