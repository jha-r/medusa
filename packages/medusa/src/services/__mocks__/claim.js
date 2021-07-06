import { IdMap } from "medusa-test-utils"
export const ClaimServiceMock = {
  withTransaction: function() {
    return this
  },
  retrieve: jest.fn().mockImplementation(data => {
    return Promise.resolve({ order_id: IdMap.getId("test-order") })
  }),
}

const mock = jest.fn().mockImplementation(() => {
  return ClaimServiceMock
})

export default mock
