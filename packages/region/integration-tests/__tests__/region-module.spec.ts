import { IRegionModuleService } from "@medusajs/types"
import { DefaultsUtils } from "@medusajs/utils"
import { SqlEntityManager } from "@mikro-orm/postgresql"
import { initialize } from "../../src"
import { DB_URL, MikroOrmWrapper } from "../utils"

jest.setTimeout(30000)

describe("Region Module Service", () => {
  let service: IRegionModuleService
  let testManager: SqlEntityManager
  let repositoryManager: SqlEntityManager

  beforeEach(async () => {
    await MikroOrmWrapper.setupDatabase()
    repositoryManager = await MikroOrmWrapper.forkManager()

    service = await initialize({
      database: {
        clientUrl: DB_URL,
        schema: process.env.MEDUSA_REGION_DB_SCHEMA,
      },
    })

    testManager = await MikroOrmWrapper.forkManager()
  })

  afterEach(async () => {
    await MikroOrmWrapper.clearDatabase()
  })

  beforeEach(async () => {
    await MikroOrmWrapper.setupDatabase()
    testManager = MikroOrmWrapper.forkManager()

    if (service.__hooks?.onApplicationStart) {
      await service.__hooks.onApplicationStart()
    }
  })

  it("should create countries and currencies on application start", async () => {
    const countries = await service.listCountries()
    const currencies = await service.listCurrencies()

    expect(countries.length).toBeGreaterThan(0)
    expect(currencies.length).toBeGreaterThan(0)
  })

  it.only("should create countries added to default ones", async () => {
    const [, count] = await service.listAndCountCountries()
    const initialCountries = Object.keys(DefaultsUtils.defaultCountries)

    expect(count).toEqual(initialCountries.length)

    DefaultsUtils.defaultCountries.push({
      name: "Dogecoin",
      alpha2: "DOGE",
      alpha3: "DOGE",
      numeric: "420",
    })

    // TODO: This is a hack to force the service to re-create the countries
    await service.__hooks!.onApplicationStart!()

    const [, newCount] = await service.listAndCountCountries()

    console.log(newCount)

    expect(newCount).toEqual(initialCountries.length + 1)
  })

  it("should create and list a region", async () => {
    const createdRegion = await service.create({
      name: "Europe",
      currency_code: "EUR",
    })

    expect(createdRegion).toEqual(
      expect.objectContaining({
        id: createdRegion.id,
        name: "Europe",
        currency_code: "EUR",
        currency: expect.objectContaining({
          code: "eur",
          name: "Euro",
        }),
        countries: [],
      })
    )

    const region = await service.retrieve(createdRegion.id, {
      relations: ["currency", "countries"],
    })

    expect(region).toEqual(
      expect.objectContaining({
        id: region.id,
        name: "Europe",
        currency_code: "EUR",
        currency: expect.objectContaining({
          code: "eur",
          name: "Euro",
        }),
        countries: [],
      })
    )
  })

  it("should fail when currency does not exist", async () => {
    await expect(
      service.create({
        name: "Europe",
        currency_code: "DOGECOIN",
      })
    ).rejects.toThrowError("Currency with code: DOGECOIN was not found")
  })
})
