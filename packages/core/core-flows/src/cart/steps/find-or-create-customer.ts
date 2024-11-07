import { CustomerDTO, ICustomerModuleService } from "@medusajs/framework/types"
import { Modules, validateEmail } from "@medusajs/framework/utils"
import { StepResponse, createStep } from "@medusajs/framework/workflows-sdk"

export interface FindOrCreateCustomerStepInput {
  customerId?: string | null
  email?: string | null
}

export interface FindOrCreateCustomerOutputStepOutput {
  customer?: CustomerDTO | null
  email?: string | null
}

interface StepCompensateInput {
  customer?: CustomerDTO
  customerWasCreated: boolean
  customerWasUpdated: boolean
}

export const findOrCreateCustomerStepId = "find-or-create-customer"
/**
 * This step either finds a customer matching the specified ID, or finds / create a customer
 * matching the specified email. If both ID and email are provided, ID takes precedence.
 * If the customer is a guest, the email is updated to the provided email.
 */
export const findOrCreateCustomerStep = createStep(
  findOrCreateCustomerStepId,
  async (data: FindOrCreateCustomerStepInput, { container }) => {
    if (
      typeof data.customerId === undefined &&
      typeof data.email === undefined
    ) {
      return new StepResponse(
        {
          customer: undefined,
          email: undefined,
        },
        {
          customerWasCreated: false,
          customerWasUpdated: false,
        }
      )
    }

    const service = container.resolve<ICustomerModuleService>(Modules.CUSTOMER)

    const customerData: FindOrCreateCustomerOutputStepOutput = {
      customer: null,
      email: null,
    }
    let originalCustomer: CustomerDTO | null = null
    let customerWasCreated = false
    let customerWasUpdated = false

    if (data.customerId) {
      originalCustomer = await service.retrieveCustomer(data.customerId)
      customerData.customer = originalCustomer
      customerData.email = originalCustomer.email
    }

    if (data.email) {
      const validatedEmail = (!originalCustomer &&
        validateEmail(data.email)) as string

      let [customer] = originalCustomer
        ? [originalCustomer]
        : await service.listCustomers({
            email: validatedEmail,
          })

      // if NOT a guest customer, return it
      if (customer?.has_account) {
        customerData.customer = customer
        customerData.email = customer.email

        return new StepResponse(customerData, {
          customerWasCreated,
          customerWasUpdated,
        })
      }

      if (!customer) {
        customer = await service.createCustomers({ email: validatedEmail })
        customerWasCreated = true
      }

      originalCustomer = customer

      if (customer.email !== data.email) {
        await service.updateCustomers(customer.id, { email: data.email })
        customerWasUpdated = true
      }

      customerData.customer = customer
      customerData.email = customer.email
    }

    return new StepResponse(customerData, {
      customer: originalCustomer,
      customerWasCreated,
      customerWasUpdated,
    })
  },
  async (compData, { container }) => {
    const { customer, customerWasCreated, customerWasUpdated } =
      compData as StepCompensateInput

    if ((!customerWasCreated && !customerWasUpdated) || !customer?.id) {
      return
    }

    const service = container.resolve<ICustomerModuleService>(Modules.CUSTOMER)

    if (customerWasCreated) {
      await service.deleteCustomers(customer.id)
    }

    if (customerWasUpdated) {
      await service.updateCustomers(customer.id, { email: customer.email })
    }
  }
)
