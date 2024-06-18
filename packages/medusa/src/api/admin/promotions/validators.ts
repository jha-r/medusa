import {
  ApplicationMethodAllocation,
  ApplicationMethodTargetType,
  ApplicationMethodType,
  PromotionRuleOperator,
  PromotionType,
} from "@medusajs/utils"
import { z } from "zod"
import {
  createFindParams,
  createOperatorMap,
  createSelectParams,
} from "../../utils/validators"
import { AdminCreateCampaign } from "../campaigns/validators"

export type AdminGetPromotionParamsType = z.infer<
  typeof AdminGetPromotionParams
>
export const AdminGetPromotionParams = createSelectParams()

export type AdminGetPromotionsParamsType = z.infer<
  typeof AdminGetPromotionsParams
>
export const AdminGetPromotionsParams = createFindParams({
  limit: 50,
  offset: 0,
})
  .merge(
    z.object({
      q: z.string().optional(),
      code: z.union([z.string(), z.array(z.string())]).optional(),
      campaign_id: z.union([z.string(), z.array(z.string())]).optional(),
      application_method: z
        .object({
          currency_code: z.union([z.string(), z.array(z.string())]).optional(),
        })
        .nullish(),
      created_at: createOperatorMap().optional(),
      updated_at: createOperatorMap().optional(),
      deleted_at: createOperatorMap().optional(),
      $and: z.lazy(() => AdminGetPromotionsParams.array()).optional(),
      $or: z.lazy(() => AdminGetPromotionsParams.array()).optional(),
    })
  )
  .strict()

export type AdminGetPromotionRuleParamsType = z.infer<
  typeof AdminGetPromotionRuleParams
>
export const AdminGetPromotionRuleParams = z.object({
  promotion_type: z.string().nullish(),
})

export type AdminGetPromotionRuleTypeParamsType = z.infer<
  typeof AdminGetPromotionRuleTypeParams
>
export const AdminGetPromotionRuleTypeParams = createSelectParams().merge(
  z.object({
    promotion_type: z.string().nullish(),
  })
)

export type AdminGetPromotionsRuleValueParamsType = z.infer<
  typeof AdminGetPromotionsRuleValueParams
>
export const AdminGetPromotionsRuleValueParams = createFindParams({
  limit: 100,
  offset: 0,
}).merge(
  z.object({
    q: z.string().optional(),
    value: z.union([z.string(), z.array(z.string())]).optional(),
  })
)

export type AdminCreatePromotionRuleType = z.infer<
  typeof AdminCreatePromotionRule
>
export const AdminCreatePromotionRule = z
  .object({
    operator: z.nativeEnum(PromotionRuleOperator),
    description: z.string().nullish(),
    attribute: z.string(),
    values: z.union([z.string(), z.array(z.string())]),
  })
  .strict()

export type AdminUpdatePromotionRuleType = z.infer<
  typeof AdminUpdatePromotionRule
>
export const AdminUpdatePromotionRule = z
  .object({
    id: z.string(),
    operator: z.nativeEnum(PromotionRuleOperator).nullish(),
    description: z.string().nullish(),
    attribute: z.string().nullish(),
    values: z.union([z.string(), z.array(z.string())]),
  })
  .strict()

export type AdminCreateApplicationMethodType = z.infer<
  typeof AdminCreateApplicationMethod
>
export const AdminCreateApplicationMethod = z
  .object({
    description: z.string().nullish(),
    value: z.number(),
    currency_code: z.string(),
    max_quantity: z.number().nullish(),
    type: z.nativeEnum(ApplicationMethodType),
    target_type: z.nativeEnum(ApplicationMethodTargetType),
    allocation: z.nativeEnum(ApplicationMethodAllocation).nullish(),
    target_rules: z.array(AdminCreatePromotionRule).nullish(),
    buy_rules: z.array(AdminCreatePromotionRule).nullish(),
    apply_to_quantity: z.number().nullish(),
    buy_rules_min_quantity: z.number().nullish(),
  })
  .strict()

export type AdminUpdateApplicationMethodType = z.infer<
  typeof AdminUpdateApplicationMethod
>
export const AdminUpdateApplicationMethod = z
  .object({
    description: z.string().nullish(),
    value: z.number().nullish(),
    max_quantity: z.number().nullish(),
    currency_code: z.string().nullish(),
    type: z.nativeEnum(ApplicationMethodType).nullish(),
    target_type: z.nativeEnum(ApplicationMethodTargetType).nullish(),
    allocation: z.nativeEnum(ApplicationMethodAllocation).nullish(),
    target_rules: z.array(AdminCreatePromotionRule).nullish(),
    buy_rules: z.array(AdminCreatePromotionRule).nullish(),
    apply_to_quantity: z.number().nullish(),
    buy_rules_min_quantity: z.number().nullish(),
  })
  .strict()

const promoRefinement = (promo) => {
  if (promo.campaign && promo.campaign_id) {
    return false
  }

  if (promo.type === PromotionType.BUYGET) {
    const appMethod = promo.application_method
    return (
      (appMethod?.buy_rules?.length ?? 0) > 0 &&
      appMethod?.apply_to_quantity !== undefined &&
      appMethod?.buy_rules_min_quantity !== undefined
    )
  }

  return true
}

export type AdminCreatePromotionType = z.infer<typeof AdminCreatePromotion>
export const AdminCreatePromotion = z
  .object({
    code: z.string(),
    is_automatic: z.boolean().nullish(),
    type: z.nativeEnum(PromotionType),
    campaign_id: z.string().nullish(),
    campaign: AdminCreateCampaign.nullish(),
    application_method: AdminCreateApplicationMethod,
    rules: z.array(AdminCreatePromotionRule).nullish(),
  })
  .strict()
  // In the case of a buyget promotion, we require at least one buy rule and quantities
  .refine(promoRefinement, {
    message:
      "Buyget promotions require at least one buy rule and quantities to be defined",
  })

export type AdminUpdatePromotionType = z.infer<typeof AdminUpdatePromotion>
export const AdminUpdatePromotion = z
  .object({
    code: z.string().nullish(),
    is_automatic: z.boolean().nullish(),
    type: z.nativeEnum(PromotionType).nullish(),
    campaign_id: z.string().nullish(),
    campaign: AdminCreateCampaign.nullish(),
    application_method: AdminUpdateApplicationMethod.nullish(),
    rules: z.array(AdminCreatePromotionRule).nullish(),
  })
  .strict()
  // In the case of a buyget promotion, we require at least one buy rule and quantities
  .refine(promoRefinement, {
    message:
      "Buyget promotions require at least one buy rule and quantities to be defined",
  })
