import { EntityManager, IsNull } from "typeorm"
import { FindConfig } from "../types/common"
import { buildQuery, isDefined } from "../utils"
import { MedusaError } from "medusa-core-utils"
import { OrderEditRepository } from "../repositories/order-edit"
import {
  Cart,
  Order,
  OrderEdit,
  OrderEditItemChangeType,
  OrderEditStatus,
} from "../models"
import { TransactionBaseService } from "../interfaces"
import {
  EventBusService,
  LineItemService,
  OrderEditItemChangeService,
  OrderService,
  TaxProviderService,
  TotalsService,
} from "./index"
import { CreateOrderEditInput, UpdateOrderEditInput } from "../types/order-edit"
import region from "./region"
import LineItemAdjustmentService from "./line-item-adjustment"

type InjectedDependencies = {
  manager: EntityManager
  orderEditRepository: typeof OrderEditRepository
  orderService: OrderService
  eventBusService: EventBusService
  totalsService: TotalsService
  lineItemService: LineItemService
  orderEditItemChangeService: OrderEditItemChangeService
  lineItemAdjustmentService: LineItemAdjustmentService
  taxProviderService: TaxProviderService
}

export default class OrderEditService extends TransactionBaseService {
  static readonly Events = {
    CREATED: "order-edit.created",
    UPDATED: "order-edit.updated",
    DECLINED: "order-edit.declined",
    REQUESTED: "order-edit.requested",
    CANCELED: "order-edit.canceled",
  }

  protected transactionManager_: EntityManager | undefined
  protected readonly manager_: EntityManager
  protected readonly orderEditRepository_: typeof OrderEditRepository
  protected readonly orderService_: OrderService
  protected readonly lineItemService_: LineItemService
  protected readonly eventBusService_: EventBusService
  protected readonly totalsService_: TotalsService
  protected readonly orderEditItemChangeService_: OrderEditItemChangeService
  protected readonly lineItemAdjustmentService_: LineItemAdjustmentService
  protected readonly taxProviderService_: TaxProviderService

  constructor({
    manager,
    orderEditRepository,
    orderService,
    lineItemService,
    eventBusService,
    totalsService,
    orderEditItemChangeService,
    lineItemAdjustmentService,
    taxProviderService,
  }: InjectedDependencies) {
    // eslint-disable-next-line prefer-rest-params
    super(arguments[0])

    this.manager_ = manager
    this.orderEditRepository_ = orderEditRepository
    this.orderService_ = orderService
    this.lineItemService_ = lineItemService
    this.eventBusService_ = eventBusService
    this.totalsService_ = totalsService
    this.orderEditItemChangeService_ = orderEditItemChangeService
    this.lineItemAdjustmentService_ = lineItemAdjustmentService
    this.taxProviderService_ = taxProviderService
  }

  async retrieve(
    orderEditId: string,
    config: FindConfig<OrderEdit> = {}
  ): Promise<OrderEdit> {
    const manager = this.transactionManager_ ?? this.manager_
    const orderEditRepository = manager.getCustomRepository(
      this.orderEditRepository_
    )

    const query = buildQuery({ id: orderEditId }, config)
    const orderEdit = await orderEditRepository.findOne(query)

    if (!orderEdit) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Order edit with id ${orderEditId} was not found`
      )
    }

    return orderEdit
  }

  protected async retrieveActive(
    orderId: string,
    config: FindConfig<OrderEdit> = {}
  ): Promise<OrderEdit | undefined> {
    const manager = this.transactionManager_ ?? this.manager_
    const orderEditRepository = manager.getCustomRepository(
      this.orderEditRepository_
    )

    const query = buildQuery(
      {
        order_id: orderId,
        confirmed_at: IsNull(),
        canceled_at: IsNull(),
        declined_at: IsNull(),
      },
      config
    )
    return await orderEditRepository.findOne(query)
  }

  /**
   * Compute and return the different totals from the order edit id
   * @param orderEditId
   */
  async getTotals(orderEditId: string): Promise<{
    shipping_total: number
    gift_card_total: number
    gift_card_tax_total: number
    discount_total: number
    tax_total: number | null
    subtotal: number
    total: number
  }> {
    const manager = this.transactionManager_ ?? this.manager_
    const { order_id, items } = await this.retrieve(orderEditId, {
      select: ["id", "order_id", "items"],
      relations: ["items", "items.tax_lines", "items.adjustments"],
    })
    const order = await this.orderService_
      .withTransaction(manager)
      .retrieve(order_id, {
        relations: [
          "discounts",
          "discounts.rule",
          "gift_cards",
          "region",
          "region.tax_rates",
          "shipping_methods",
          "shipping_methods.tax_lines",
        ],
      })
    const computedOrder = { ...order, items } as Order

    const totalsServiceTx = this.totalsService_.withTransaction(manager)

    const shipping_total = await totalsServiceTx.getShippingTotal(computedOrder)
    const { total: gift_card_total, tax_total: gift_card_tax_total } =
      await totalsServiceTx.getGiftCardTotal(computedOrder)
    const discount_total = await totalsServiceTx.getDiscountTotal(computedOrder)
    const tax_total = await totalsServiceTx.getTaxTotal(computedOrder)
    const subtotal = await totalsServiceTx.getSubtotal(computedOrder)
    const total = await totalsServiceTx.getTotal(computedOrder)

    return {
      shipping_total,
      gift_card_total,
      gift_card_tax_total,
      discount_total,
      tax_total,
      subtotal,
      total,
    }
  }

  async create(
    data: CreateOrderEditInput,
    context: { loggedInUserId: string }
  ): Promise<OrderEdit> {
    return await this.atomicPhase_(async (transactionManager) => {
      const activeOrderEdit = await this.retrieveActive(data.order_id)
      if (activeOrderEdit) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `An active order edit already exists for the order ${data.order_id}`
        )
      }

      const orderEditRepository = transactionManager.getCustomRepository(
        this.orderEditRepository_
      )

      const orderEditToCreate = orderEditRepository.create({
        order_id: data.order_id,
        internal_note: data.internal_note,
        created_by: context.loggedInUserId,
      })

      const orderEdit = await orderEditRepository.save(orderEditToCreate)

      const lineItemServiceTx =
        this.lineItemService_.withTransaction(transactionManager)

      const orderLineItems = await lineItemServiceTx.list(
        {
          order_id: data.order_id,
        },
        {
          select: ["id"],
        }
      )
      const lineItemIds = orderLineItems.map(({ id }) => id)
      await lineItemServiceTx.cloneTo(lineItemIds, {
        order_edit_id: orderEdit.id,
      })

      await this.eventBusService_
        .withTransaction(transactionManager)
        .emit(OrderEditService.Events.CREATED, { id: orderEdit.id })

      return orderEdit
    })
  }

  async update(
    orderEditId: string,
    data: UpdateOrderEditInput
  ): Promise<OrderEdit> {
    return await this.atomicPhase_(async (manager) => {
      const orderEditRepo = manager.getCustomRepository(
        this.orderEditRepository_
      )

      const orderEdit = await this.retrieve(orderEditId)

      for (const key of Object.keys(data)) {
        if (isDefined(data[key])) {
          orderEdit[key] = data[key]
        }
      }

      const result = await orderEditRepo.save(orderEdit)

      await this.eventBusService_
        .withTransaction(manager)
        .emit(OrderEditService.Events.UPDATED, {
          id: result.id,
        })

      return result
    })
  }

  async delete(id: string): Promise<void> {
    return await this.atomicPhase_(async (manager) => {
      const orderEditRepo = manager.getCustomRepository(
        this.orderEditRepository_
      )

      const edit = await this.retrieve(id).catch(() => void 0)

      if (!edit) {
        return
      }

      if (edit.status !== OrderEditStatus.CREATED) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Cannot delete order edit with status ${edit.status}`
        )
      }

      await this.deleteClonedItems(id)
      await orderEditRepo.remove(edit)
    })
  }

  async decline(
    orderEditId: string,
    context: {
      declinedReason?: string
      loggedInUser?: string
    }
  ): Promise<OrderEdit> {
    return await this.atomicPhase_(async (manager) => {
      const orderEditRepo = manager.getCustomRepository(
        this.orderEditRepository_
      )

      const { loggedInUser, declinedReason } = context

      const orderEdit = await this.retrieve(orderEditId)

      if (orderEdit.status === OrderEditStatus.DECLINED) {
        return orderEdit
      }

      if (orderEdit.status !== OrderEditStatus.REQUESTED) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Cannot decline an order edit with status ${orderEdit.status}.`
        )
      }

      orderEdit.declined_at = new Date()
      orderEdit.declined_by = loggedInUser
      orderEdit.declined_reason = declinedReason

      const result = await orderEditRepo.save(orderEdit)

      await this.eventBusService_
        .withTransaction(manager)
        .emit(OrderEditService.Events.DECLINED, {
          id: result.id,
        })

      return result
    })
  }

  /**
   * Create or update order edit item change line item and apply the quatity
   * - If the item change already exists then update the quantity of the line item as well as the line adjustments and tax lines
   * - If the item change does not exist then create the item change and cloned the original line item with the quantity as well as the line adjustments and tax lines
   * @param orderEditId
   * @param originalLineItemId
   * @param data
   */
  async updateLineItem(
    orderEditId: string,
    originalLineItemId: string,
    data: { quantity: number }
  ): Promise<void> {
    return await this.atomicPhase_(async (manager) => {
      const orderEdit = await this.retrieve(orderEditId, {
        select: [
          "id",
          "items",
          "order_id",
          "created_at",
          "requested_at",
          "confirmed_at",
          "declined_at",
          "canceled_at",
        ],
        relations: ["items"],
      })

      const isOrderEditActive = OrderEditService.isOrderEditActive(orderEdit)
      if (!isOrderEditActive) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Can not update an item on the order edit ${orderEditId} with the status ${orderEdit.status}`
        )
      }

      const clonedLineItem = orderEdit.items?.find(
        (item) => item.original_item_id === originalLineItemId
      )

      if (!clonedLineItem) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Invalid line item id ${originalLineItemId} unable to find the line item on the order edit for the order ${orderEdit.order_id}.`
        )
      }

      const orderEditItemChangeServiceTx =
        this.orderEditItemChangeService_.withTransaction(manager)

      let change = (
        await orderEditItemChangeServiceTx.list(
          {
            original_line_item_id: originalLineItemId,
            type: OrderEditItemChangeType.ITEM_UPDATE,
          },
          {
            select: ["line_item_id", "original_line_item_id"],
          }
        )
      ).pop()

      if (!change) {
        change = await orderEditItemChangeServiceTx.create({
          type: OrderEditItemChangeType.ITEM_UPDATE,
          order_edit_id: orderEditId,
          original_line_item_id: originalLineItemId,
          line_item_id: clonedLineItem.id,
        })
      }

      await this.lineItemService_
        .withTransaction(manager)
        .update(change.line_item_id!, {
          quantity: data.quantity,
        })

      await this.refreshAdjustmentAndTaxLines(orderEditId)
    })
  }

  protected async refreshAdjustmentAndTaxLines(
    orderEditId: string
  ): Promise<void> {
    const manager = this.transactionManager_ ?? this.manager_

    const lineItemAdjustmentServiceTx =
      this.lineItemAdjustmentService_.withTransaction(manager)
    const taxProviderServiceTx =
      this.taxProviderService_.withTransaction(manager)

    const orderEdit = await this.retrieve(orderEditId, {
      relations: [
        "items",
        "items.adjustments",
        "order",
        "order.customer",
        "order.discounts",
        "order.discounts.rule",
        "order.gift_cards",
        "order.region",
        "order.shipping_address",
        "order.shipping_methods",
      ],
    })

    const clonedItemIds: string[] = []
    const clonedItemAdjustmentIds: string[] = []

    orderEdit.items.forEach((item) => {
      clonedItemIds.push(item.id)
      if (item.adjustments?.length) {
        item.adjustments.forEach((adjustment) => {
          clonedItemAdjustmentIds.push(adjustment.id)
        })
      }
    })

    await Promise.all([
      lineItemAdjustmentServiceTx.delete(clonedItemAdjustmentIds),
      taxProviderServiceTx.clearLineItemsTaxLines(clonedItemIds),
    ])

    const localCart = {
      ...orderEdit.order,
      object: "cart",
      items: orderEdit.items,
    } as unknown as Cart

    await lineItemAdjustmentServiceTx.createAdjustments(localCart)

    const calcContext = await this.totalsService_
      .withTransaction(manager)
      .getCalculationContext(localCart, {
        exclude_shipping: true,
      })

    await taxProviderServiceTx.createTaxLines(localCart, calcContext)
  }

  async decorateTotals(orderEdit: OrderEdit): Promise<OrderEdit> {
    const totals = await this.getTotals(orderEdit.id)
    orderEdit.discount_total = totals.discount_total
    orderEdit.gift_card_total = totals.gift_card_total
    orderEdit.gift_card_tax_total = totals.gift_card_tax_total
    orderEdit.shipping_total = totals.shipping_total
    orderEdit.subtotal = totals.subtotal
    orderEdit.tax_total = totals.tax_total
    orderEdit.total = totals.total

    return orderEdit
  }

  async deleteItemChange(
    orderEditId: string,
    itemChangeId: string
  ): Promise<void> {
    return await this.atomicPhase_(async (manager) => {
      const itemChange = await this.orderEditItemChangeService_.retrieve(
        itemChangeId,
        { select: ["id", "order_edit_id"] }
      )

      const orderEdit = await this.retrieve(orderEditId, {
        select: ["id", "confirmed_at", "canceled_at"],
      })

      if (orderEdit.id !== itemChange.order_edit_id) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `The item change you are trying to delete doesn't belong to the OrderEdit with id: ${orderEditId}.`
        )
      }

      if (orderEdit.confirmed_at !== null || orderEdit.canceled_at !== null) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Cannot delete and item change from a ${orderEdit.status} order edit`
        )
      }

      return await this.orderEditItemChangeService_.delete(itemChangeId)
    })
  }

  async requestConfirmation(
    orderEditId: string,
    context: {
      loggedInUser?: string
    } = {}
  ): Promise<OrderEdit> {
    return await this.atomicPhase_(async (manager) => {
      const orderEditRepo = manager.getCustomRepository(
        this.orderEditRepository_
      )

      let orderEdit = await this.retrieve(orderEditId, {
        relations: ["changes"],
        select: ["id", "requested_at"],
      })

      if (!orderEdit.changes?.length) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "Cannot request a confirmation on an edit with no changes"
        )
      }

      if (orderEdit.requested_at) {
        return orderEdit
      }

      orderEdit.requested_at = new Date()
      orderEdit.requested_by = context.loggedInUser

      orderEdit = await orderEditRepo.save(orderEdit)

      await this.eventBusService_
        .withTransaction(manager)
        .emit(OrderEditService.Events.REQUESTED, { id: orderEditId })

      return orderEdit
    })
  }

  protected async deleteClonedItems(orderEditId: string): Promise<void> {
    const manager = this.transactionManager_ ?? this.manager_
    const lineItemServiceTx = this.lineItemService_.withTransaction(manager)
    const lineItemAdjustmentServiceTx =
      this.lineItemAdjustmentService_.withTransaction(manager)
    const taxProviderServiceTs =
      this.taxProviderService_.withTransaction(manager)

    const clonedLineItems = await lineItemServiceTx.list(
      {
        order_edit_id: orderEditId,
      },
      {
        select: ["id", "tax_lines", "adjustments"],
        relations: ["tax_lines", "adjustments"],
      }
    )
    const clonedItemIds = clonedLineItems.map((item) => item.id)

    await Promise.all(
      [
        taxProviderServiceTs.clearLineItemsTaxLines(clonedItemIds),
        clonedItemIds.map(async (id) => {
          return await lineItemAdjustmentServiceTx.delete({
            item_id: id,
          })
        }),
      ].flat()
    )

    await Promise.all(
      clonedItemIds.map(async (id) => {
        return await lineItemServiceTx.delete(id)
      })
    )
  }

  async cancel(
    orderEditId: string,
    context: { loggedInUser?: string } = {}
  ): Promise<OrderEdit> {
    return await this.atomicPhase_(async (manager) => {
      const orderEditRepository = manager.getCustomRepository(
        this.orderEditRepository_
      )

      const orderEdit = await this.retrieve(orderEditId)

      if (orderEdit.status === OrderEditStatus.CANCELED) {
        return orderEdit
      }

      if (
        [OrderEditStatus.CONFIRMED, OrderEditStatus.DECLINED].includes(
          orderEdit.status
        )
      ) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `Cannot cancel order edit with status ${orderEdit.status}`
        )
      }

      orderEdit.canceled_at = new Date()
      orderEdit.canceled_by = context.loggedInUser

      const saved = await orderEditRepository.save(orderEdit)

      await this.eventBusService_
        .withTransaction(manager)
        .emit(OrderEditService.Events.CANCELED, { id: orderEditId })

      return saved
    })
  }

  private static isOrderEditActive(orderEdit: OrderEdit): boolean {
    return !(
      orderEdit.status === OrderEditStatus.CONFIRMED ||
      orderEdit.status === OrderEditStatus.CANCELED ||
      orderEdit.status === OrderEditStatus.DECLINED
    )
  }
}
