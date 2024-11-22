import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../../helpers/create-admin-user"
import { createAuthenticatedCustomer } from "../../../helpers/create-authenticated-customer"

jest.setTimeout(50000)

const env = { MEDUSA_FF_MEDUSA_V2: true }

medusaIntegrationTestRunner({
  env,
  testSuite: ({ dbConnection, getContainer, api }) => {
    describe("POST /store/customers/me", () => {
      let appContainer
      let storeHeaders

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        const publishableKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey })
      })

      it("should update a customer", async () => {
        const { customer, jwt } = await createAuthenticatedCustomer(
          api,
          storeHeaders
        )

        const response = await api.post(
          `/store/customers/me`,
          {
            first_name: "John2",
            last_name: "Doe2",
          },
          {
            headers: {
              authorization: `Bearer ${jwt}`,
              ...storeHeaders.headers,
            },
          }
        )

        expect(response.status).toEqual(200)
        expect(response.data.customer).toEqual(
          expect.objectContaining({
            id: customer.id,
            first_name: "John2",
            last_name: "Doe2",
            email: "tony@start.com",
          })
        )
      })
    })
  },
})
