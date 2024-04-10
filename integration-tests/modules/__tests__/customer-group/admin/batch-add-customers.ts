import { ModuleRegistrationName } from "@medusajs/modules-sdk"
import { ICustomerModuleService } from "@medusajs/types"
import { medusaIntegrationTestRunner } from "medusa-test-utils"
import { createAdminUser } from "../../../../helpers/create-admin-user"

jest.setTimeout(50000)

const env = { MEDUSA_FF_MEDUSA_V2: true }
const adminHeaders = {
  headers: { "x-medusa-access-token": "test_token" },
}

medusaIntegrationTestRunner({
  env,
  testSuite: ({ dbConnection, getContainer, api }) => {
    describe("POST /admin/customer-groups/:id/customers/batch/add", () => {
      let appContainer
      let customerModuleService: ICustomerModuleService

      beforeAll(async () => {
        appContainer = getContainer()
        customerModuleService = appContainer.resolve(
          ModuleRegistrationName.CUSTOMER
        )
      })

      beforeEach(async () => {
        await createAdminUser(dbConnection, adminHeaders, appContainer)
      })

      it("should batch add customers to a group", async () => {
        const group = await customerModuleService.createCustomerGroup({
          name: "VIP",
        })
        const customers = await customerModuleService.create([
          {
            first_name: "Test",
            last_name: "Test",
          },
          {
            first_name: "Test2",
            last_name: "Test2",
          },
          {
            first_name: "Test3",
            last_name: "Test3",
          },
        ])

        const response = await api.post(
          `/admin/customer-groups/${group.id}/customers/batch/add`,
          {
            customer_ids: customers.map((c) => ({ id: c.id })),
          },
          adminHeaders
        )

        expect(response.status).toEqual(200)

        const updatedGroup = await customerModuleService.retrieveCustomerGroup(
          group.id,
          {
            relations: ["customers"],
          }
        )
        expect(updatedGroup.customers?.length).toEqual(3)
      })
    })
  },
})
