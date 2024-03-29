import { Outlet, useLoaderData, useParams } from "react-router-dom"

import { JsonViewSection } from "../../../components/common/json-view-section"
import { useV2Promotion } from "../../../lib/api-v2/promotion"
import { CampaignSection } from "./components/campaign-section"
import { PromotionConditionsSection } from "./components/promotion-conditions-section"
import { PromotionGeneralSection } from "./components/promotion-general-section"
import { promotionLoader } from "./loader"

import after from "medusa-admin:widgets/promotion/details/after"
import before from "medusa-admin:widgets/promotion/details/before"

export const PromotionDetail = () => {
  const initialData = useLoaderData() as Awaited<
    ReturnType<typeof promotionLoader>
  >

  const { id } = useParams()
  const { promotion, isLoading } = useV2Promotion(id!, {}, { initialData })

  if (isLoading || !promotion) {
    return <div>Loading...</div>
  }

  return (
    <div className="flex flex-col gap-y-2">
      {before.widgets.map((w, i) => {
        return (
          <div key={i}>
            <w.Component />
          </div>
        )
      })}

      <div className="flex flex-col gap-x-4 xl:flex-row xl:items-start">
        <div className="flex w-full flex-col gap-y-2">
          <PromotionGeneralSection promotion={promotion} />

          <PromotionConditionsSection
            rules={promotion.rules || []}
            ruleType={"rules"}
          />

          <PromotionConditionsSection
            rules={promotion.application_method?.target_rules || []}
            ruleType={"target_rules"}
          />

          {promotion.type === "buyget" && (
            <PromotionConditionsSection
              rules={promotion.application_method?.buy_rules || []}
              ruleType={"buy_rules"}
            />
          )}

          <div className="flex w-full flex-col gap-y-2 xl:hidden">
            <CampaignSection campaign={promotion.campaign!} />
          </div>
          {after.widgets.map((w, i) => {
            return (
              <div key={i}>
                <w.Component />
              </div>
            )
          })}
          <JsonViewSection data={promotion as any} />
        </div>

        <div className="hidden w-full max-w-[400px] flex-col gap-y-2 xl:flex">
          <CampaignSection campaign={promotion.campaign!} />
        </div>
      </div>
      <Outlet />
    </div>
  )
}
