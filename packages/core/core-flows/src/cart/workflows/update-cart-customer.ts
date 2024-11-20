import { isDefined, MedusaError } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  transform,
  when,
  WorkflowData,
} from "@medusajs/framework/workflows-sdk"
import { CustomerDTO } from "@medusajs/types"
import { useQueryGraphStep } from "../../common"
import { updateCartsStep } from "../steps"

/**
 * This step validates if cart should be updated
 */
export const validateCartCustomerUpdateStep = createStep(
  "validate-cart-customer-update",
  async function ({
    cart,
    customer,
  }: {
    cart: {
      customer?: { id: string; has_account: boolean }
    }
    customer: CustomerDTO
  }) {
    // If cart customer is the same as the provided customer, succeed early
    // Pass in a boolean to not perform a customer update
    if (isDefined(cart.customer?.id) && cart.customer.id === customer.id) {
      return new StepResponse(false)
    }

    // If the cart customer already has an account, we can safely assume that its already
    // been assigned to a different customer. This falls under cart take over, which isn't being
    // handled with this workflow
    if (cart.customer?.has_account) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Cannot update cart customer when its assigned to a different customer`
      )
    }

    return new StepResponse(true)
  }
)

export const updateCartCustomerWorkflowId = "update-cart-customer"
/**
 * This workflow updates cart's customer.
 */
export const updateCartCustomerWorkflow = createWorkflow(
  updateCartCustomerWorkflowId,
  (input: WorkflowData<{ id: string; customer_id: string }>) => {
    const cartQuery = useQueryGraphStep({
      entity: "cart",
      filters: { id: input.id },
      fields: [
        "id",
        "email",
        "customer_id",
        "customer.has_account",
        "shipping_address.*",
        "region.*",
        "region.countries.*",
      ],
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-cart" })

    const cart = transform({ cartQuery }, ({ cartQuery }) => cartQuery.data[0])

    const customerQuery = useQueryGraphStep({
      entity: "customer",
      filters: { id: input.customer_id },
      fields: ["id", "email"],
      options: { throwIfKeyNotFound: true },
    }).config({ name: "get-customer" })

    const customer = transform(
      { customerQuery },
      ({ customerQuery }) => customerQuery.data[0]
    )

    const shouldUpdate = validateCartCustomerUpdateStep({ cart, customer })

    when({ shouldUpdate }, ({ shouldUpdate }) => !!shouldUpdate).then(() => {
      const cartInput = transform({ cart, customer }, ({ cart, customer }) => [
        {
          id: cart.id,
          customer_id: customer.id,
          email: customer.email,
        },
      ])

      updateCartsStep(cartInput)
    })
  }
)
