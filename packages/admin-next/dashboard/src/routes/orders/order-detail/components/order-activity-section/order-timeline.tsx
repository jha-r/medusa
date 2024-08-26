import { IconButton, Text, Tooltip, clx, usePrompt, Button } from "@medusajs/ui"
import * as Collapsible from "@radix-ui/react-collapsible"

import { PropsWithChildren, ReactNode, useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { XMarkMini } from "@medusajs/icons"
import {
  AdminClaim,
  AdminExchange,
  AdminFulfillment,
  AdminOrder,
  AdminReturn,
} from "@medusajs/types"
import { useTranslation } from "react-i18next"

import { useClaims } from "../../../../../hooks/api/claims"
import { useExchanges } from "../../../../../hooks/api/exchanges"
import {
  useCancelReturnRequest,
  useReturns,
} from "../../../../../hooks/api/returns"
import { useDate } from "../../../../../hooks/use-date"
import { getStylizedAmount } from "../../../../../lib/money-amount-helpers"
import { getPaymentsFromOrder } from "../order-payment-section"

type OrderTimelineProps = {
  order: AdminOrder
}

/**
 * Arbitrary high limit to ensure all notes are fetched
 */
const NOTE_LIMIT = 9999

export const OrderTimeline = ({ order }: OrderTimelineProps) => {
  const items = useActivityItems(order)

  if (items.length <= 3) {
    return (
      <div className="flex flex-col gap-y-0.5">
        {items.map((item, index) => {
          return (
            <OrderActivityItem
              key={index}
              title={item.title}
              timestamp={item.timestamp}
              isFirst={index === items.length - 1}
            >
              {item.children}
            </OrderActivityItem>
          )
        })}
      </div>
    )
  }

  const lastItems = items.slice(0, 2)
  const collapsibleItems = items.slice(2, items.length - 1)
  const firstItem = items[items.length - 1]

  return (
    <div className="flex flex-col gap-y-0.5">
      {lastItems.map((item, index) => {
        return (
          <OrderActivityItem
            key={index}
            title={item.title}
            timestamp={item.timestamp}
          >
            {item.children}
          </OrderActivityItem>
        )
      })}
      <OrderActivityCollapsible activities={collapsibleItems} />
      <OrderActivityItem
        title={firstItem.title}
        timestamp={firstItem.timestamp}
        isFirst
      >
        {firstItem.children}
      </OrderActivityItem>
    </div>
  )
}

type Activity = {
  title: string
  timestamp: string | Date
  children?: ReactNode
}

const useActivityItems = (order: AdminOrder) => {
  const { t } = useTranslation()

  const { returns = [] } = useReturns({
    order_id: order.id,
    fields: "+received_at,*items",
  })

  const { claims = [] } = useClaims({
    order_id: order.id,
    fields: "*additional_items",
  })

  const { exchanges = [] } = useExchanges({
    order_id: order.id,
    fields: "*additional_items",
  })

  const payments = getPaymentsFromOrder(order)

  const notes = []
  const isLoading = false
  // const { notes, isLoading, isError, error } = useNotes(
  //   {
  //     resource_id: order.id,
  //     limit: NOTE_LIMIT,
  //     offset: 0,
  //   },
  //   {
  //     keepPreviousData: true,
  //   }
  // )
  //
  // if (isError) {
  //   throw error
  // }

  return useMemo(() => {
    if (isLoading) {
      return []
    }

    const items: Activity[] = []

    for (const payment of payments) {
      const amount = payment.amount as number

      items.push({
        title: t("orders.activity.events.payment.awaiting"),
        timestamp: payment.created_at!,
        children: (
          <Text size="small" className="text-ui-fg-subtle">
            {getStylizedAmount(amount, payment.currency_code)}
          </Text>
        ),
      })

      if (payment.canceled_at) {
        items.push({
          title: t("orders.activity.events.payment.canceled"),
          timestamp: payment.canceled_at,
          children: (
            <Text size="small" className="text-ui-fg-subtle">
              {getStylizedAmount(amount, payment.currency_code)}
            </Text>
          ),
        })
      }

      if (payment.captured_at) {
        items.push({
          title: t("orders.activity.events.payment.captured"),
          timestamp: payment.captured_at,
          children: (
            <Text size="small" className="text-ui-fg-subtle">
              {getStylizedAmount(amount, payment.currency_code)}
            </Text>
          ),
        })
      }

      for (const refund of payment.refunds || []) {
        items.push({
          title: t("orders.activity.events.payment.refunded"),
          timestamp: refund.created_at,
          children: (
            <Text size="small" className="text-ui-fg-subtle">
              {getStylizedAmount(
                refund.amount as number,
                payment.currency_code
              )}
            </Text>
          ),
        })
      }
    }

    for (const fulfillment of order.fulfillments || []) {
      items.push({
        title: t("orders.activity.events.fulfillment.created"),
        timestamp: fulfillment.created_at,
        children: <FulfillmentCreatedBody fulfillment={fulfillment} />,
      })

      if (fulfillment.shipped_at) {
        items.push({
          title: t("orders.activity.events.fulfillment.shipped"),
          timestamp: fulfillment.shipped_at,
          children: (
            <FulfillmentCreatedBody fulfillment={fulfillment} isShipment />
          ),
        })
      }

      if (fulfillment.canceled_at) {
        items.push({
          title: t("orders.activity.events.fulfillment.canceled"),
          timestamp: fulfillment.canceled_at,
        })
      }
    }

    const returnMap = new Map<string, AdminReturn>()

    for (const ret of returns) {
      returnMap.set(ret.id, ret)

      if (ret.claim_id || ret.exchange_id) {
        continue
      }

      // Always display created action
      items.push({
        title: t("orders.activity.events.return.created", {
          returnId: ret.id.slice(-7),
        }),
        timestamp: ret.created_at,
        children: <ReturnBody orderReturn={ret} isCreated />,
      })

      if (ret.status === "received" || ret.status === "partially_received") {
        items.push({
          title: t("orders.activity.events.return.received", {
            returnId: ret.id.slice(-7),
          }),
          timestamp: ret.received_at,
          children: <ReturnBody orderReturn={ret} />,
        })
      }
    }

    for (const claim of claims) {
      const claimReturn = returnMap.get(claim.return_id!)

      items.push({
        title: t("orders.activity.events.claim.created", {
          claimId: claim.id.slice(-7),
        }),
        timestamp: claim.created_at,
        children: <ClaimBody claim={claim} claimReturn={claimReturn} />,
      })
    }

    for (const exchange of exchanges) {
      const exchangeReturn = returnMap.get(exchange.return_id!)

      items.push({
        title: t("orders.activity.events.exchange.created", {
          exchangeId: exchange.id.slice(-7),
        }),
        timestamp: exchange.created_at,
        children: (
          <ExchangeBody exchange={exchange} exchangeReturn={exchangeReturn} />
        ),
      })
    }

    // for (const note of notes || []) {
    //   items.push({
    //     title: t("orders.activity.events.note.comment"),
    //     timestamp: note.created_at,
    //     children: <NoteBody note={note} />,
    //   })
    // }

    if (order.canceled_at) {
      items.push({
        title: t("orders.activity.events.canceled.title"),
        timestamp: order.canceled_at,
      })
    }

    const sortedActivities = items.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    const createdAt = {
      title: t("orders.activity.events.placed.title"),
      timestamp: order.created_at,
      children: (
        <Text size="small" className="text-ui-fg-subtle">
          {getStylizedAmount(order.total, order.currency_code)}
        </Text>
      ),
    }

    return [...sortedActivities, createdAt]
  }, [order, notes, isLoading, t])
}

type OrderActivityItemProps = PropsWithChildren<{
  title: string
  timestamp: string | Date
  isFirst?: boolean
}>

const OrderActivityItem = ({
  title,
  timestamp,
  isFirst = false,
  children,
}: OrderActivityItemProps) => {
  const { getFullDate, getRelativeDate } = useDate()

  return (
    <div className="grid grid-cols-[20px_1fr] items-start gap-2">
      <div className="flex size-full flex-col items-center gap-y-0.5">
        <div className="flex size-5 items-center justify-center">
          <div className="bg-ui-bg-base shadow-borders-base flex size-2.5 items-center justify-center rounded-full">
            <div className="bg-ui-tag-neutral-icon size-1.5 rounded-full" />
          </div>
        </div>
        {!isFirst && <div className="bg-ui-border-base w-px flex-1" />}
      </div>
      <div
        className={clx({
          "pb-4": !isFirst,
        })}
      >
        <div className="flex items-center justify-between">
          <Text size="small" leading="compact" weight="plus">
            {title}
          </Text>
          {timestamp && (
            <Tooltip
              content={getFullDate({ date: timestamp, includeTime: true })}
            >
              <Text
                size="small"
                leading="compact"
                className="text-ui-fg-subtle"
              >
                {getRelativeDate(timestamp)}
              </Text>
            </Tooltip>
          )}
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}

const OrderActivityCollapsible = ({
  activities,
}: {
  activities: Activity[]
}) => {
  const [open, setOpen] = useState(false)

  const { t } = useTranslation()

  if (!activities.length) {
    return null
  }

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      {!open && (
        <div className="grid grid-cols-[20px_1fr] items-start gap-2">
          <div className="flex size-full flex-col items-center">
            <div className="border-ui-border-strong w-px flex-1 bg-[linear-gradient(var(--border-strong)_33%,rgba(255,255,255,0)_0%)] bg-[length:1px_3px] bg-right bg-repeat-y" />
          </div>
          <div className="pb-4">
            <Collapsible.Trigger className="text-left">
              <Text
                size="small"
                leading="compact"
                weight="plus"
                className="text-ui-fg-muted"
              >
                {t("orders.activity.showMoreActivities", {
                  count: activities.length,
                })}
              </Text>
            </Collapsible.Trigger>
          </div>
        </div>
      )}
      <Collapsible.Content>
        <div className="flex flex-col gap-y-0.5">
          {activities.map((item, index) => {
            return (
              <OrderActivityItem
                key={index}
                title={item.title}
                timestamp={item.timestamp}
              >
                {item.children}
              </OrderActivityItem>
            )
          })}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}

const NoteBody = ({ note }: { note: Note }) => {
  const { t } = useTranslation()
  const prompt = usePrompt()

  const { first_name, last_name, email } = note.author || {}
  const name = [first_name, last_name].filter(Boolean).join(" ")

  const byLine = t("orders.activity.events.note.byLine", {
    author: name || email,
  })

  const { mutateAsync } = {} // useAdminDeleteNote(note.id)

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: "This action cannot be undone",
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await mutateAsync()
  }

  return (
    <div className="flex flex-col gap-y-2 pt-2">
      <div className="bg-ui-bg-component shadow-borders-base group grid grid-cols-[1fr_20px] items-start gap-x-2 text-pretty rounded-r-2xl rounded-bl-md rounded-tl-xl px-3 py-1.5">
        <div className="flex h-full min-h-7 items-center">
          <Text size="xsmall" className="text-ui-fg-subtle">
            {note.value}
          </Text>
        </div>
        <IconButton
          size="small"
          variant="transparent"
          className="transition-fg invisible opacity-0 group-hover:visible group-hover:opacity-100"
          type="button"
          onClick={handleDelete}
        >
          <span className="sr-only">
            {t("orders.activity.comment.deleteButtonText")}
          </span>
          <XMarkMini className="text-ui-fg-muted" />
        </IconButton>
      </div>
      <Link
        to={`/settings/users/${note.author_id}`}
        className="text-ui-fg-subtle hover:text-ui-fg-base transition-fg w-fit"
      >
        <Text size="small">{byLine}</Text>
      </Link>
    </div>
  )
}

const FulfillmentCreatedBody = ({
  fulfillment,
}: {
  fulfillment: AdminFulfillment
}) => {
  const { t } = useTranslation()

  const numberOfItems = fulfillment.items.reduce((acc, item) => {
    return acc + item.quantity
  }, 0)

  return (
    <div>
      <Text size="small" className="text-ui-fg-subtle">
        {t("orders.activity.events.fulfillment.items", {
          count: numberOfItems,
        })}
      </Text>
    </div>
  )
}

const ReturnBody = ({
  orderReturn,
  isCreated,
}: {
  orderReturn: AdminReturn
  isCreated: boolean
}) => {
  const { t } = useTranslation()

  const { mutateAsync: cancelReturnRequest } = useCancelReturnRequest(
    orderReturn.id,
    orderReturn.order_id
  )

  const numberOfItems = orderReturn.items.reduce((acc, item) => {
    return acc + item.quantity
  }, 0)

  return (
    <div className="flex items-start gap-1">
      <Text size="small" className="text-ui-fg-subtle">
        {t("orders.activity.events.return.items", {
          count: numberOfItems,
        })}
      </Text>
      {isCreated && (
        <div className="mt-[2px] flex items-center leading-none">⋅</div>
      )}
      {isCreated && (
        <Button
          onClick={() => cancelReturnRequest()}
          className="text-ui-fg-subtle h-auto px-0 leading-none hover:bg-transparent"
          variant="transparent"
          size="small"
        >
          {t("actions.cancel")}
        </Button>
      )}
    </div>
  )
}

const ClaimBody = ({
  claim,
  claimReturn,
}: {
  claim: AdminClaim
  claimReturn?: AdminReturn
}) => {
  const { t } = useTranslation()

  const outboundItems = (claim.additional_items || []).reduce(
    (acc, item) => (acc + item.quantity) as number,
    0
  )

  const inboundItems = (claimReturn?.items || []).reduce(
    (acc, item) => acc + item.quantity,
    0
  )

  return (
    <div>
      {outboundItems > 0 && (
        <Text size="small" className="text-ui-fg-subtle">
          {t("orders.activity.events.claim.itemsInbound", {
            count: outboundItems,
          })}
        </Text>
      )}

      {inboundItems > 0 && (
        <Text size="small" className="text-ui-fg-subtle">
          {t("orders.activity.events.claim.itemsOutbound", {
            count: inboundItems,
          })}
        </Text>
      )}
    </div>
  )
}

const ExchangeBody = ({
  exchange,
  exchangeReturn,
}: {
  exchange: AdminExchange
  exchangeReturn?: AdminReturn
}) => {
  const { t } = useTranslation()

  const outboundItems = (exchange.additional_items || []).reduce(
    (acc, item) => (acc + item.quantity) as number,
    0
  )

  const inboundItems = (exchangeReturn?.items || []).reduce(
    (acc, item) => acc + item.quantity,
    0
  )

  return (
    <div>
      {outboundItems > 0 && (
        <Text size="small" className="text-ui-fg-subtle">
          {t("orders.activity.events.exchange.itemsInbound", {
            count: outboundItems,
          })}
        </Text>
      )}

      {inboundItems > 0 && (
        <Text size="small" className="text-ui-fg-subtle">
          {t("orders.activity.events.exchange.itemsOutbound", {
            count: inboundItems,
          })}
        </Text>
      )}
    </div>
  )
}
