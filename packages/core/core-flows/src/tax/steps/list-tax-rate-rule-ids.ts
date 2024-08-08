import { FilterableTaxRateRuleProps, ITaxModuleService } from "@medusajs/types"
import { ModuleRegistrationName } from "@medusajs/utils"
import { createStep, StepResponse } from "@medusajs/workflows-sdk"

export type ListTaxRateRuleIdsStepInput = {
  selector: FilterableTaxRateRuleProps
}

export const listTaxRateRuleIdsStepId = "list-tax-rate-rule-ids"
/**
 * This step retrieves the IDs of tax rate rules matching the specified filters.
 */
export const listTaxRateRuleIdsStep = createStep(
  listTaxRateRuleIdsStepId,
  async (input: ListTaxRateRuleIdsStepInput, { container }) => {
    const service = container.resolve<ITaxModuleService>(
      ModuleRegistrationName.TAX
    )

    const rules = await service.listTaxRateRules(input.selector, {
      select: ["id"],
    })
    return new StepResponse(rules.map((r) => r.id))
  }
)
