import _ from "lodash"
import { BaseService } from "medusa-interfaces"
import { MedusaError } from "medusa-core-utils"

/**
 * Handles swaps
 * @implements BaseService
 */
class SwapService extends BaseService {
  constructor({ totalsService, lineItemService }) {
    super()

    /** @private @const {TotalsService} */
    this.totalsService_ = totalsService

    /** @priate @const {LineItemService} */
    this.lineItemService_ = lineItemService
  }

  /**
   * Retrieves the order line items, given an array of items.
   * @param {Order} order - the order to get line items from
   * @param {{ item_id: string, quantity: number }} items - the items to get
   * @param {function} transformer - a function to apply to each of the items
   *    retrieved from the order, should return a line item. If the transformer
   *    returns an undefined value the line item will be filtered from the
   *    returned array.
   * @return {Promise<Array<LineItem>>} the line items generated by the transformer.
   */
  async getFulfillmentItems_(order, items, transformer) {
    const toReturn = await Promise.all(
      items.map(async ({ item_id, quantity }) => {
        const item = order.items.find(i => i._id.equals(item_id))
        return transformer(item, quantity)
      })
    )

    return toReturn.filter(i => !!i)
  }

  /**
   * Checks that a given quantity of a line item can be returned. Fails if the
   * item is undefined or if the returnable quantity of the item is lower, than
   * the quantity that is requested to be returned.
   * @param {LineItem?} item - the line item to check has sufficient returnable
   *   quantity.
   * @param {number} quantity - the quantity that is requested to be returned.
   * @return {LineItem} a line item where the quantity is set to the requested
   *   return quantity.
   */
  transformReturnItem_(item, quantity) {
    if (!item) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "The item was not found in the order"
      )
    }

    const returnable = item.fulfilled_quantity - item.returned_quantity
    if (quantity > returnable) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "The item has not been fulfilled - use update/add/remove items to edit unfulfilled items"
      )
    }

    return {
      ...item,
      quantity,
    }
  }

  /**
   * @typedef {Object} FulfillmentItem
   * @property {string} item_id - The id of an item in an order
   * @property {number} quantity - The quantity of the item to extract
   */

  /**
   * Goes through all return items and ensures that they can be returned. Will
   * return the resulting line items to store in the swap.
   * @param {Order} order - the order to validate the return items against
   * @param {Array<FulfillmentItem>} returnItems - the items to validate
   * @returns {Array<LineItem>} the validated return items
   */
  async validateReturnItems_(order, returnItems) {
    return this.getFulfillmentItems_(
      order,
      returnItems,
      this.transformReturnItem_
    )
  }

  /**
   * Goes through all newly ordered items
   */
  validateAdditionalItems_(additionalItems) {}

  async create(order, returnItems, additionalItems, returnShipping, shipping) {}
}

export default SwapService
