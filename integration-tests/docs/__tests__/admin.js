const fixtureWriter = require("../utils/write-fixture").default
const { useApi } = require("../../helpers/use-api")
const { useDb } = require("../../helpers/use-db")

const adminSeeder = require("../helpers/admin-seeder")

const customerTest = require("../test-input/admin/customer")
const discountTest = require("../test-input/admin/discount")
const doTest = require("../test-input/admin/draft-order")
const gcTest = require("../test-input/admin/gift-card")
const orderTest = require("../test-input/admin/order")
const productTest = require("../test-input/admin/product")
const rrTest = require("../test-input/admin/return-reason")
const swapTest = require("../test-input/admin/swap")
<<<<<<< HEAD
const collectionTest = require("../test-input/admin/collection")
=======
const noteTest = require("../test-input/admin/note")
>>>>>>> 347c8550213978c8c9e02485c2e0e4f66fb6cec0

const toTest = [
  customerTest,
  discountTest,
  doTest,
  gcTest,
  orderTest,
  productTest,
  rrTest,
  swapTest,
<<<<<<< HEAD
  collectionTest,
=======
  noteTest,
>>>>>>> 347c8550213978c8c9e02485c2e0e4f66fb6cec0
]

jest.setTimeout(30000)

test.each(toTest)(
  "$operationId",
  async ({ setup, buildEndpoint, snapshotMatch, operationId }) => {
    const api = useApi()
    const db = useDb()
    await adminSeeder(db.connection)

    const manager = db.connection.manager
    const id = await setup(manager, api)

    const response = await api
      .get(buildEndpoint(id), {
        headers: {
          Authorization: "Bearer test_token",
        },
      })
      .catch((err) => {
        console.log(err)
      })

    expect(response.data).toMatchSnapshot(snapshotMatch)

    fixtureWriter.addFixture(`admin.${operationId}`, response.data)
  }
)
