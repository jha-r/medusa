import { Modules } from "@medusajs/modules-sdk"
import {
  CreateShippingOptionDTO,
  IFulfillmentModuleService
} from "@medusajs/types"
import { moduleIntegrationTestRunner, SuiteOptions } from "medusa-test-utils"
import { generateCreateShippingOptionsData } from "../../__fixtures__"

jest.setTimeout(100000)

// TODO: Temporary until the providers are sorted out
const createProvider = async (MikroOrmWrapper, providerId: string) => {
  const [{ id }] = await MikroOrmWrapper.forkManager().execute(
    `insert into service_provider (id) values ('${providerId}') returning id`
  )

  return id
}

moduleIntegrationTestRunner({
  moduleName: Modules.FULFILLMENT,
  testSuite: ({
    MikroOrmWrapper,
    service,
  }: SuiteOptions<IFulfillmentModuleService>) => {
    describe("Fulfillment Module Service", () => {
      describe("read", () => {
        describe("shipping options", () => {
          it("should list shipping options with a filter", async function () {
            const fulfillmentSet = await service.create({
              name: "test",
              type: "test-type",
              service_zones: [
                {
                  name: "test",
                },
              ],
            })

            const shippingProfile = await service.createShippingProfiles({
              name: "test",
              type: "default",
            })

            const providerId = await createProvider(
              MikroOrmWrapper,
              "sp_jdafwfleiwuonl"
            )

            const [shippingOption1] = await service.createShippingOptions([
              generateCreateShippingOptionsData({
                service_zone_id: fulfillmentSet.service_zones[0].id,
                shipping_profile_id: shippingProfile.id,
                service_provider_id: providerId,
                rules: [
                  {
                    attribute: "test-attribute",
                    operator: "in",
                    value: ["test"],
                  },
                ],
              }),
              generateCreateShippingOptionsData({
                service_zone_id: fulfillmentSet.service_zones[0].id,
                shipping_profile_id: shippingProfile.id,
                service_provider_id: providerId,
                rules: [
                  {
                    attribute: "test-attribute",
                    operator: "eq",
                    value: "test",
                  },
                  {
                    attribute: "test-attribute2.options",
                    operator: "in",
                    value: ["test", "test2"],
                  },
                ],
              }),
            ])

            const listedOptions = await service.listShippingOptions({
              name: shippingOption1.name,
            })

            expect(listedOptions).toHaveLength(1)
            expect(listedOptions[0].id).toEqual(shippingOption1.id)
          })

          it("should list shipping options with a context", async function () {
            const fulfillmentSet = await service.create({
              name: "test",
              type: "test-type",
              service_zones: [
                {
                  name: "test",
                },
              ],
            })

            const shippingProfile = await service.createShippingProfiles({
              name: "test",
              type: "default",
            })

            const providerId = await createProvider(
              MikroOrmWrapper,
              "sp_jdafwfleiwuonl"
            )

            const [shippingOption1, , shippingOption3] =
              await service.createShippingOptions([
                generateCreateShippingOptionsData({
                  service_zone_id: fulfillmentSet.service_zones[0].id,
                  shipping_profile_id: shippingProfile.id,
                  service_provider_id: providerId,
                  rules: [
                    {
                      attribute: "test-attribute",
                      operator: "in",
                      value: ["test"],
                    },
                  ],
                }),
                generateCreateShippingOptionsData({
                  service_zone_id: fulfillmentSet.service_zones[0].id,
                  shipping_profile_id: shippingProfile.id,
                  service_provider_id: providerId,
                  rules: [
                    {
                      attribute: "test-attribute",
                      operator: "in",
                      value: ["test-test"],
                    },
                  ],
                }),
                generateCreateShippingOptionsData({
                  service_zone_id: fulfillmentSet.service_zones[0].id,
                  shipping_profile_id: shippingProfile.id,
                  service_provider_id: providerId,
                  rules: [
                    {
                      attribute: "test-attribute",
                      operator: "eq",
                      value: "test",
                    },
                    {
                      attribute: "test-attribute2.options",
                      operator: "in",
                      value: ["test", "test2"],
                    },
                  ],
                }),
              ])

            let listedOptions = await service.listShippingOptions({
              context: {
                "test-attribute": "test",
                "test-attribute2": {
                  options: "test2",
                },
              },
            })

            expect(listedOptions).toHaveLength(2)
            expect(listedOptions).toEqual(
              expect.arrayContaining([
                expect.objectContaining({ id: shippingOption1.id }),
                expect.objectContaining({ id: shippingOption3.id }),
              ])
            )

            listedOptions = await service.listShippingOptions({
              fulfillment_set_id: { $ne: fulfillmentSet.id },
              context: {
                "test-attribute": "test",
                "test-attribute2": {
                  options: "test2",
                },
              },
            })

            expect(listedOptions).toHaveLength(0)

            listedOptions = await service.listShippingOptions({
              fulfillment_set_type: "non-existing-type",
              context: {
                "test-attribute": "test",
                "test-attribute2": {
                  options: "test2",
                },
              },
            })

            expect(listedOptions).toHaveLength(0)
          })
        })
      })

      describe("mutations", () => {
        describe("on create", () => {
          it("should create a new shipping option", async function () {
            const shippingProfile = await service.createShippingProfiles({
              name: "test",
              type: "default",
            })
            const fulfillmentSet = await service.create({
              name: "test",
              type: "test-type",
            })
            const serviceZone = await service.createServiceZones({
              name: "test",
              fulfillment_set_id: fulfillmentSet.id,
            })

            const providerId = await createProvider(
              MikroOrmWrapper,
              "sp_jdafwfleiwuonl"
            )

            const createData: CreateShippingOptionDTO =
              generateCreateShippingOptionsData({
                service_zone_id: serviceZone.id,
                shipping_profile_id: shippingProfile.id,
                service_provider_id: providerId,
              })

            const createdShippingOption = await service.createShippingOptions(
              createData
            )

            expect(createdShippingOption).toEqual(
              expect.objectContaining({
                id: expect.any(String),
                name: createData.name,
                price_type: createData.price_type,
                service_zone_id: createData.service_zone_id,
                shipping_profile_id: createData.shipping_profile_id,
                service_provider_id: createData.service_provider_id,
                shipping_option_type_id: expect.any(String),
                type: expect.objectContaining({
                  id: expect.any(String),
                  code: createData.type.code,
                  description: createData.type.description,
                  label: createData.type.label,
                }),
                data: createData.data,
                rules: expect.arrayContaining([
                  expect.objectContaining({
                    id: expect.any(String),
                    attribute: createData.rules![0].attribute,
                    operator: createData.rules![0].operator,
                    value: createData.rules![0].value,
                  }),
                ]),
              })
            )
          })

          it("should create multiple new shipping options", async function () {
            const shippingProfile = await service.createShippingProfiles({
              name: "test",
              type: "default",
            })
            const fulfillmentSet = await service.create({
              name: "test",
              type: "test-type",
            })
            const serviceZone = await service.createServiceZones({
              name: "test",
              fulfillment_set_id: fulfillmentSet.id,
            })

            const providerId = await createProvider(
              MikroOrmWrapper,
              "sp_jdafwfleiwuonl"
            )

            const createData: CreateShippingOptionDTO[] = [
              generateCreateShippingOptionsData({
                service_zone_id: serviceZone.id,
                shipping_profile_id: shippingProfile.id,
                service_provider_id: providerId,
              }),
              generateCreateShippingOptionsData({
                service_zone_id: serviceZone.id,
                shipping_profile_id: shippingProfile.id,
                service_provider_id: providerId,
              }),
            ]

            const createdShippingOptions = await service.createShippingOptions(
              createData
            )

            expect(createdShippingOptions).toHaveLength(2)

            let i = 0
            for (const data_ of createData) {
              expect(createdShippingOptions[i]).toEqual(
                expect.objectContaining({
                  id: expect.any(String),
                  name: data_.name,
                  price_type: data_.price_type,
                  service_zone_id: data_.service_zone_id,
                  shipping_profile_id: data_.shipping_profile_id,
                  service_provider_id: data_.service_provider_id,
                  shipping_option_type_id: expect.any(String),
                  type: expect.objectContaining({
                    id: expect.any(String),
                    code: data_.type.code,
                    description: data_.type.description,
                    label: data_.type.label,
                  }),
                  data: data_.data,
                  rules: expect.arrayContaining([
                    expect.objectContaining({
                      id: expect.any(String),
                      attribute: data_.rules![0].attribute,
                      operator: data_.rules![0].operator,
                      value: data_.rules![0].value,
                    }),
                  ]),
                })
              )
              ++i
            }
          })

          it("should fail to create a new shipping option with invalid rules", async function () {
            const shippingProfile = await service.createShippingProfiles({
              name: "test",
              type: "default",
            })
            const fulfillmentSet = await service.create({
              name: "test",
              type: "test-type",
            })
            const serviceZone = await service.createServiceZones({
              name: "test",
              fulfillment_set_id: fulfillmentSet.id,
            })

            const providerId = await createProvider(
              MikroOrmWrapper,
              "sp_jdafwfleiwuonl"
            )

            const createData: CreateShippingOptionDTO =
              generateCreateShippingOptionsData({
                service_zone_id: serviceZone.id,
                shipping_profile_id: shippingProfile.id,
                service_provider_id: providerId,
                rules: [
                  {
                    attribute: "test-attribute",
                    operator: "invalid" as any,
                    value: "test-value",
                  },
                ],
              })

            const err = await service
              .createShippingOptions(createData)
              .catch((e) => e)

            expect(err).toBeDefined()
            expect(err.message).toBe(
              "Rule operator invalid is not supported. Must be one of in, eq, ne, gt, gte, lt, lte, nin"
            )
          })
        })

        describe("on update", () => {
          it("should update a shipping option", async () => {
            const fulfillmentSet = await service.create({
              name: "test",
              type: "test-type",
            })
            const serviceZone = await service.createServiceZones({
              name: "test",
              fulfillment_set_id: fulfillmentSet.id,
            })
            const shippingProfile = await service.createShippingProfiles({
              name: "test",
              type: "default",
            })

            const providerId = await createProvider(
              MikroOrmWrapper,
              "sp_jdafwfleiwuonl"
            )

            const shippingOptionData = generateCreateShippingOptionsData({
              service_zone_id: serviceZone.id,
              shipping_profile_id: shippingProfile.id,
              service_provider_id: providerId,
            })

            const shippingOption = await service.createShippingOptions(
              shippingOptionData
            )

            const updateData = {
              id: shippingOption.id,
              name: "updated-test",
              price_type: "calculated",
              service_zone_id: serviceZone.id,
              shipping_profile_id: shippingProfile.id,
              service_provider_id: providerId,
              type: {
                code: "updated-test",
                description: "updated-test",
                label: "updated-test",
              },
              data: {
                amount: 2000,
              },
              rules: [
                {
                  attribute: "new-test",
                  operator: "eq",
                  value: "new-test",
                },
              ],
            }

            const updatedShippingOption = await service.updateShippingOptions(
              updateData
            )

            expect(updatedShippingOption).toEqual(
              expect.objectContaining({
                id: updateData.id,
                name: updateData.name,
                price_type: updateData.price_type,
                service_zone_id: updateData.service_zone_id,
                shipping_profile_id: updateData.shipping_profile_id,
                service_provider_id: updateData.service_provider_id,
                shipping_option_type_id: expect.any(String),
                type: expect.objectContaining({
                  id: expect.any(String),
                  code: updateData.type.code,
                  description: updateData.type.description,
                  label: updateData.type.label,
                }),
                data: updateData.data,
                rules: expect.arrayContaining([
                  expect.objectContaining({
                    id: expect.any(String),
                    attribute: updateData.rules[0].attribute,
                    operator: updateData.rules[0].operator,
                    value: updateData.rules[0].value,
                  }),
                ]),
              })
            )

            const rules = await service.listShippingOptionRules()
            expect(rules).toHaveLength(1)
            expect(rules[0]).toEqual(
              expect.objectContaining({
                id: updatedShippingOption.rules[0].id,
              })
            )

            const types = await service.listShippingOptionTypes()
            expect(types).toHaveLength(1)
            expect(types[0]).toEqual(
              expect.objectContaining({
                code: updateData.type.code,
                description: updateData.type.description,
                label: updateData.type.label,
              })
            )
          })

          it("should update a shipping option without updating the rules or the type", async () => {
            const fulfillmentSet = await service.create({
              name: "test",
              type: "test-type",
            })
            const serviceZone = await service.createServiceZones({
              name: "test",
              fulfillment_set_id: fulfillmentSet.id,
            })
            const shippingProfile = await service.createShippingProfiles({
              name: "test",
              type: "default",
            })

            const providerId = await createProvider(
              MikroOrmWrapper,
              "sp_jdafwfleiwuonl"
            )

            const shippingOptionData = generateCreateShippingOptionsData({
              service_zone_id: serviceZone.id,
              shipping_profile_id: shippingProfile.id,
              service_provider_id: providerId,
            })

            const shippingOption = await service.createShippingOptions(
              shippingOptionData
            )

            const updateData = {
              id: shippingOption.id,
              name: "updated-test",
              price_type: "calculated",
              service_zone_id: serviceZone.id,
              shipping_profile_id: shippingProfile.id,
              service_provider_id: providerId,
              data: {
                amount: 2000,
              },
            }

            await service.updateShippingOptions(updateData)

            const updatedShippingOption = await service.retrieveShippingOption(
              shippingOption.id,
              {
                relations: ["rules", "type"],
              }
            )

            expect(updatedShippingOption).toEqual(
              expect.objectContaining({
                id: updateData.id,
                name: updateData.name,
                price_type: updateData.price_type,
                service_zone_id: updateData.service_zone_id,
                shipping_profile_id: updateData.shipping_profile_id,
                service_provider_id: updateData.service_provider_id,
                shipping_option_type_id: expect.any(String),
                type: expect.objectContaining({
                  id: expect.any(String),
                  code: shippingOptionData.type.code,
                  description: shippingOptionData.type.description,
                  label: shippingOptionData.type.label,
                }),
                data: updateData.data,
                rules: expect.arrayContaining([
                  expect.objectContaining({
                    id: expect.any(String),
                    attribute: shippingOptionData.rules[0].attribute,
                    operator: shippingOptionData.rules[0].operator,
                    value: shippingOptionData.rules[0].value,
                  }),
                ]),
              })
            )

            const rules = await service.listShippingOptionRules()
            expect(rules).toHaveLength(1)
            expect(rules[0]).toEqual(
              expect.objectContaining({
                id: updatedShippingOption.rules[0].id,
              })
            )

            const types = await service.listShippingOptionTypes()
            expect(types).toHaveLength(1)
            expect(types[0]).toEqual(
              expect.objectContaining({
                code: shippingOptionData.type.code,
                description: shippingOptionData.type.description,
                label: shippingOptionData.type.label,
              })
            )
          })

          it("should update a collection of shipping options", async () => {
            const fulfillmentSet = await service.create({
              name: "test",
              type: "test-type",
            })
            const serviceZone = await service.createServiceZones({
              name: "test",
              fulfillment_set_id: fulfillmentSet.id,
            })
            const shippingProfile = await service.createShippingProfiles({
              name: "test",
              type: "default",
            })

            const providerId = await createProvider(
              MikroOrmWrapper,
              "sp_jdafwfleiwuonl"
            )

            const shippingOptionData = [
              generateCreateShippingOptionsData({
                service_zone_id: serviceZone.id,
                shipping_profile_id: shippingProfile.id,
                service_provider_id: providerId,
              }),
              generateCreateShippingOptionsData({
                service_zone_id: serviceZone.id,
                shipping_profile_id: shippingProfile.id,
                service_provider_id: providerId,
              }),
            ]

            const shippingOptions = await service.createShippingOptions(
              shippingOptionData
            )

            const updateData = [
              {
                id: shippingOptions[0].id,
                name: "updated-test",
                price_type: "calculated",
                service_zone_id: serviceZone.id,
                shipping_profile_id: shippingProfile.id,
                service_provider_id: providerId,
                type: {
                  code: "updated-test",
                  description: "updated-test",
                  label: "updated-test",
                },
                data: {
                  amount: 2000,
                },
                rules: [
                  {
                    attribute: "new-test",
                    operator: "eq",
                    value: "new-test",
                  },
                ],
              },
              {
                id: shippingOptions[1].id,
                name: "updated-test",
                price_type: "calculated",
                service_zone_id: serviceZone.id,
                shipping_profile_id: shippingProfile.id,
                service_provider_id: providerId,
                type: {
                  code: "updated-test",
                  description: "updated-test",
                  label: "updated-test",
                },
                data: {
                  amount: 2000,
                },
                rules: [
                  {
                    attribute: "new-test",
                    operator: "eq",
                    value: "new-test",
                  },
                ],
              },
            ]

            const updatedShippingOption = await service.updateShippingOptions(
              updateData
            )

            for (const data_ of updateData) {
              const expectedShippingOption = updatedShippingOption.find(
                (shippingOption) => shippingOption.id === data_.id
              )
              expect(expectedShippingOption).toEqual(
                expect.objectContaining({
                  id: data_.id,
                  name: data_.name,
                  price_type: data_.price_type,
                  service_zone_id: data_.service_zone_id,
                  shipping_profile_id: data_.shipping_profile_id,
                  service_provider_id: data_.service_provider_id,
                  shipping_option_type_id: expect.any(String),
                  type: expect.objectContaining({
                    id: expect.any(String),
                    code: data_.type.code,
                    description: data_.type.description,
                    label: data_.type.label,
                  }),
                  data: data_.data,
                  rules: expect.arrayContaining([
                    expect.objectContaining({
                      id: expect.any(String),
                      attribute: data_.rules[0].attribute,
                      operator: data_.rules[0].operator,
                      value: data_.rules[0].value,
                    }),
                  ]),
                })
              )
            }

            const rules = await service.listShippingOptionRules()
            expect(rules).toHaveLength(2)
            expect(rules).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  id: updatedShippingOption[0].rules[0].id,
                }),
                expect.objectContaining({
                  id: updatedShippingOption[1].rules[0].id,
                }),
              ])
            )

            const types = await service.listShippingOptionTypes()
            expect(types).toHaveLength(2)
            expect(types).toEqual(
              expect.arrayContaining([
                expect.objectContaining({
                  code: updateData[0].type.code,
                  description: updateData[0].type.description,
                  label: updateData[0].type.label,
                }),
                expect.objectContaining({
                  code: updateData[1].type.code,
                  description: updateData[1].type.description,
                  label: updateData[1].type.label,
                }),
              ])
            )
          })

          it("should fail to update a non-existent shipping option", async () => {
            const fulfillmentSet = await service.create({
              name: "test",
              type: "test-type",
            })
            const serviceZone = await service.createServiceZones({
              name: "test",
              fulfillment_set_id: fulfillmentSet.id,
            })
            const shippingProfile = await service.createShippingProfiles({
              name: "test",
              type: "default",
            })

            const [serviceProvider] =
              await MikroOrmWrapper.forkManager().execute(
                "insert into service_provider (id) values ('sp_jdafwfleiwuonl') returning id"
              )

            const shippingOptionData = {
              id: "sp_jdafwfleiwuonl",
              name: "test",
              price_type: "flat",
              service_zone_id: serviceZone.id,
              shipping_profile_id: shippingProfile.id,
              service_provider_id: serviceProvider.id,
              type: {
                code: "test",
                description: "test",
                label: "test",
              },
              data: {
                amount: 1000,
              },
              rules: [
                {
                  attribute: "test",
                  operator: "eq",
                  value: "test",
                },
              ],
            }

            const err = await service
              .updateShippingOptions(shippingOptionData)
              .catch((e) => e)

            expect(err).toBeDefined()
            expect(err.message).toBe(
              `The following shipping options do not exist: ${shippingOptionData.id}`
            )
          })

          it("should fail to update a shipping option when adding non existing rules", async () => {
            const fulfillmentSet = await service.create({
              name: "test",
              type: "test-type",
            })
            const serviceZone = await service.createServiceZones({
              name: "test",
              fulfillment_set_id: fulfillmentSet.id,
            })
            const shippingProfile = await service.createShippingProfiles({
              name: "test",
              type: "default",
            })

            const providerId = await createProvider(
              MikroOrmWrapper,
              "sp_jdafwfleiwuonl"
            )

            const shippingOptionData = generateCreateShippingOptionsData({
              service_zone_id: serviceZone.id,
              shipping_profile_id: shippingProfile.id,
              service_provider_id: providerId,
            })

            const shippingOption = await service.createShippingOptions(
              shippingOptionData
            )

            const updateData = [
              {
                id: shippingOption.id,
                rules: [
                  {
                    id: "sp_jdafwfleiwuonl",
                  },
                ],
              },
            ]

            const err = await service
              .updateShippingOptions(updateData)
              .catch((e) => e)

            expect(err).toBeDefined()
            expect(err.message).toBe(
              `The following rules does not exists: ${updateData[0].rules[0].id} on shipping option ${shippingOption.id}`
            )
          })

          it("should fail to update a shipping option when adding invalid rules", async () => {
            const fulfillmentSet = await service.create({
              name: "test",
              type: "test-type",
            })
            const serviceZone = await service.createServiceZones({
              name: "test",
              fulfillment_set_id: fulfillmentSet.id,
            })
            const shippingProfile = await service.createShippingProfiles({
              name: "test",
              type: "default",
            })

            const providerId = await createProvider(
              MikroOrmWrapper,
              "sp_jdafwfleiwuonl"
            )

            const shippingOptionData = generateCreateShippingOptionsData({
              service_zone_id: serviceZone.id,
              shipping_profile_id: shippingProfile.id,
              service_provider_id: providerId,
            })

            const shippingOption = await service.createShippingOptions(
              shippingOptionData
            )

            const updateData = [
              {
                id: shippingOption.id,
                rules: [
                  {
                    attribute: "test",
                    operator: "invalid",
                    value: "test",
                  },
                ],
              },
            ]

            const err = await service
              .updateShippingOptions(updateData)
              .catch((e) => e)

            expect(err).toBeDefined()
            expect(err.message).toBe(
              `Rule operator invalid is not supported. Must be one of in, eq, ne, gt, gte, lt, lte, nin`
            )
          })
        })
      })
    })
  },
})
