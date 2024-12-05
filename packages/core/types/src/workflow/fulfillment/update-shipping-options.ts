import { RuleOperatorType } from "../../common"
import { ShippingOptionPriceType } from "../../fulfillment"
import { PriceRule } from "../../pricing"

export interface UpdateShippingOptionsWorkflowInput {
  id: string
  name?: string
  service_zone_id?: string
  shipping_profile_id?: string
  data?: Record<string, unknown>
  price_type?: ShippingOptionPriceType
  provider_id?: string
  type?: {
    label: string
    description: string
    code: string
  }
  prices?: (
    | {
        id?: string
        currency_code?: string
        amount?: number
        rules?: PriceRule[]
      }
    | {
        id?: string
        region_id?: string
        amount?: number
        rules?: PriceRule[]
      }
  )[]
  rules?: {
    attribute: string
    operator: RuleOperatorType
    value: string | string[]
  }[]
}

export type UpdateShippingOptionsWorkflowOutput = {
  id: string
}[]
