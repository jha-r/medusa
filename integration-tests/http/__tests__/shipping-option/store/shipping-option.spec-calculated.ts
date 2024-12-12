import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import {
  createAdminUser,
  generatePublishableKey,
  generateStoreHeaders,
} from "../../../../helpers/create-admin-user"

jest.setTimeout(50000)

const env = { MEDUSA_FF_MEDUSA_V2: true }
const adminHeaders = { headers: { "x-medusa-access-token": "test_token" } }

medusaIntegrationTestRunner({
  env,
  testSuite: ({ dbConnection, getContainer, api }) => {
    describe("Store: Shipping Option API", () => {
      let appContainer
      let salesChannel
      let region
      let regionTwo
      let product
      let stockLocation
      let shippingProfile
      let fulfillmentSet
      let cart
      let shippingOptionCalculated
      let shippingOptionFlat
      let storeHeaders

      beforeAll(async () => {
        appContainer = getContainer()
      })

      beforeEach(async () => {
        const publishableKey = await generatePublishableKey(appContainer)
        storeHeaders = generateStoreHeaders({ publishableKey })

        await createAdminUser(dbConnection, adminHeaders, appContainer)

        region = (
          await api.post(
            "/admin/regions",
            { name: "US", currency_code: "usd", countries: ["US"] },
            adminHeaders
          )
        ).data.region

        regionTwo = (
          await api.post(
            "/admin/regions",
            {
              name: "Test region two",
              currency_code: "dkk",
              countries: ["DK"],
              is_tax_inclusive: true,
            },
            adminHeaders
          )
        ).data.region

        salesChannel = (
          await api.post(
            "/admin/sales-channels",
            { name: "first channel", description: "channel" },
            adminHeaders
          )
        ).data.sales_channel

        product = (
          await api.post(
            "/admin/products",
            {
              title: "Test fixture",
              options: [
                { title: "size", values: ["large", "small"] },
                { title: "color", values: ["green"] },
              ],
              variants: [
                {
                  title: "Test variant",
                  manage_inventory: false,
                  prices: [
                    {
                      currency_code: "usd",
                      amount: 100,
                    },
                    {
                      currency_code: "dkk",
                      amount: 100,
                    },
                  ],
                  options: {
                    size: "large",
                    color: "green",
                  },
                },
              ],
            },
            adminHeaders
          )
        ).data.product

        stockLocation = (
          await api.post(
            `/admin/stock-locations`,
            { name: "test location" },
            adminHeaders
          )
        ).data.stock_location

        await api.post(
          `/admin/stock-locations/${stockLocation.id}/sales-channels`,
          { add: [salesChannel.id] },
          adminHeaders
        )

        shippingProfile = (
          await api.post(
            `/admin/shipping-profiles`,
            { name: "Test", type: "default" },
            adminHeaders
          )
        ).data.shipping_profile

        const fulfillmentSets = (
          await api.post(
            `/admin/stock-locations/${stockLocation.id}/fulfillment-sets?fields=*fulfillment_sets`,
            {
              name: "Test",
              type: "test-type",
            },
            adminHeaders
          )
        ).data.stock_location.fulfillment_sets

        fulfillmentSet = (
          await api.post(
            `/admin/fulfillment-sets/${fulfillmentSets[0].id}/service-zones`,
            {
              name: "Test",
              geo_zones: [
                { type: "country", country_code: "us" },
                { type: "country", country_code: "dk" },
              ],
            },
            adminHeaders
          )
        ).data.fulfillment_set

        await api.post(
          `/admin/stock-locations/${stockLocation.id}/fulfillment-providers`,
          {
            add: [
              "manual_test-provider",
              "manual-calculated_test-provider-calculated",
            ],
          },
          adminHeaders
        )

        shippingOptionCalculated = (
          await api.post(
            `/admin/shipping-options`,
            {
              name: "Calculated shipping option",
              service_zone_id: fulfillmentSet.service_zones[0].id,
              shipping_profile_id: shippingProfile.id,
              provider_id: "manual-calculated_test-provider-calculated",
              price_type: "calculated",
              type: {
                label: "Test type",
                description: "Test description",
                code: "test-code",
              },
              prices: [],
              rules: [],
            },
            adminHeaders
          )
        ).data.shipping_option

        shippingOptionFlat = (
          await api.post(
            `/admin/shipping-options`,
            {
              name: "Flat rate shipping option",
              service_zone_id: fulfillmentSet.service_zones[0].id,
              shipping_profile_id: shippingProfile.id,
              provider_id: "manual_test-provider",
              price_type: "flat",
              type: {
                label: "Test type",
                description: "Test description",
                code: "test-code",
              },
              prices: [
                {
                  currency_code: "usd",
                  amount: 1000,
                },
                {
                  region_id: region.id,
                  amount: 1100,
                },
                {
                  region_id: region.id,
                  amount: 0,
                  rules: [
                    {
                      operator: "gt",
                      attribute: "item_total",
                      value: 2000,
                    },
                  ],
                },
                {
                  region_id: regionTwo.id,
                  amount: 500,
                },
              ],
              rules: [],
            },
            adminHeaders
          )
        ).data.shipping_option
      })

      describe("GET /store/shipping-options?cart_id=", () => {
        it("should get calculated and flat rateshipping options for a cart successfully", async () => {
          cart = (
            await api.post(
              `/store/carts`,
              {
                region_id: region.id,
                sales_channel_id: salesChannel.id,
                currency_code: "usd",
                email: "test@admin.com",
                items: [
                  {
                    variant_id: product.variants[0].id,
                    quantity: 2,
                  },
                ],
              },
              storeHeaders
            )
          ).data.cart

          const resp = await api.get(
            `/store/shipping-options?cart_id=${cart.id}`,
            storeHeaders
          )

          const shippingOptions = resp.data.shipping_options

          expect(shippingOptions).toHaveLength(2)
          expect(shippingOptions).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                id: shippingOptionFlat.id,
                name: "Flat rate shipping option",
                price_type: "flat",
                amount: 1100,
                calculated_price: expect.objectContaining({
                  calculated_amount: 1100,
                }),
              }),
              expect.objectContaining({
                id: shippingOptionCalculated.id,
                name: "Calculated shipping option",
                price_type: "calculated",
                amount: 3,
                // calculated_price: expect.objectContaining({
                //   calculated_amount: 300,
                // }),
              }),
            ])
          )
        })
      })
    })
  },
})
