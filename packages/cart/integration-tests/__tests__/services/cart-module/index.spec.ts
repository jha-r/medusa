import { ICartModuleService } from "@medusajs/types"
import { CheckConstraintViolationException } from "@mikro-orm/core"
import { initialize } from "../../../../src/initialize"
import { DB_URL, MikroOrmWrapper } from "../../../utils"

jest.setTimeout(30000)

describe("Cart Module Service", () => {
  let service: ICartModuleService

  beforeEach(async () => {
    await MikroOrmWrapper.setupDatabase()

    service = await initialize({
      database: {
        clientUrl: DB_URL,
        schema: process.env.MEDUSA_CART_DB_SCHEMA,
      },
    })
  })

  afterEach(async () => {
    await MikroOrmWrapper.clearDatabase()
  })

  describe("create", () => {
    it("should throw an error when required params are not passed", async () => {
      const error = await service
        .create([
          {
            email: "test@email.com",
          } as any,
        ])
        .catch((e) => e)

      expect(error.message).toContain(
        "Value for Cart.currency_code is required, 'undefined' found"
      )
    })

    it.only("should create a line item with prices in different shapes", async () => {
      // TODO: Will be removed. This is here for demoing purposes
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
          items: [
            {
              title: "one",
              quantity: 1,
              // proof of backward compatibility
              unit_price: 100,
            },
            {
              title: "two",
              quantity: 1,
              // raw price creation
              unit_price: { value: "1234.1234" },
            },
            {
              title: "three",
              quantity: 1,
              // string price creation
              unit_price: "200",
            },
          ],
        },
      ])

      const cart = await service.retrieve(createdCart.id, {
        relations: ["items", "items.adjustments"],
      })

      const itemOne = cart.items?.find((el) => el.title === "one")
      const itemTwo = cart.items?.find((el) => el.title === "two")
      const itemThree = cart.items?.find((el) => el.title === "three")

      expect(JSON.parse(JSON.stringify(itemOne))).toEqual(
        expect.objectContaining({
          unit_price: 100,
          title: "one",
        })
      )
      expect(JSON.parse(JSON.stringify(itemTwo))).toEqual(
        expect.objectContaining({
          unit_price: 1234.1234,
          title: "two",
        })
      )
      expect(JSON.parse(JSON.stringify(itemThree))).toEqual(
        expect.objectContaining({
          unit_price: 200,
          title: "three",
        })
      )
    })

    it("should create a cart successfully", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [cart] = await service.list({ id: [createdCart.id] })

      expect(cart).toEqual(
        expect.objectContaining({
          id: createdCart.id,
          currency_code: "eur",
        })
      )
    })

    it("should create a cart with billing + shipping address successfully", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
          billing_address: {
            first_name: "John",
            last_name: "Doe",
          },
          shipping_address: {
            first_name: "John",
            last_name: "Doe",
          },
        },
      ])

      const [cart] = await service.list(
        { id: [createdCart.id] },
        { relations: ["billing_address", "shipping_address"] }
      )

      expect(cart).toEqual(
        expect.objectContaining({
          id: createdCart.id,
          currency_code: "eur",
          billing_address: expect.objectContaining({
            first_name: "John",
            last_name: "Doe",
          }),
          shipping_address: expect.objectContaining({
            first_name: "John",
            last_name: "Doe",
          }),
        })
      )
    })

    it("should create a cart with billing id + shipping id successfully", async () => {
      const [createdAddress] = await service.createAddresses([
        {
          first_name: "John",
          last_name: "Doe",
        },
      ])

      const [createdCart] = await service.create([
        {
          currency_code: "eur",
          billing_address_id: createdAddress.id,
          shipping_address_id: createdAddress.id,
        },
      ])

      expect(createdCart).toEqual(
        expect.objectContaining({
          id: createdCart.id,
          currency_code: "eur",
          billing_address: expect.objectContaining({
            id: createdAddress.id,
            first_name: "John",
            last_name: "Doe",
          }),
          shipping_address: expect.objectContaining({
            id: createdAddress.id,
            first_name: "John",
            last_name: "Doe",
          }),
        })
      )
    })

    it("should create a cart with items", async () => {
      const createdCart = await service.create({
        currency_code: "eur",
        items: [
          {
            title: "test",
            quantity: 1,
            unit_price: 100,
          },
        ],
      })

      const cart = await service.retrieve(createdCart.id, {
        relations: ["items"],
      })

      expect(cart).toEqual(
        expect.objectContaining({
          id: createdCart.id,
          currency_code: "eur",
          items: expect.arrayContaining([
            expect.objectContaining({
              title: "test",
              unit_price: 100,
            }),
          ]),
        })
      )
    })

    it("should create multiple carts with items", async () => {
      const createdCarts = await service.create([
        {
          currency_code: "eur",
          items: [
            {
              title: "test",
              quantity: 1,
              unit_price: 100,
            },
          ],
        },
        {
          currency_code: "usd",
          items: [
            {
              title: "test-2",
              quantity: 2,
              unit_price: 200,
            },
          ],
        },
      ])

      const carts = await service.list(
        { id: createdCarts.map((c) => c.id) },
        {
          relations: ["items"],
        }
      )

      expect(carts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            currency_code: "eur",
            items: expect.arrayContaining([
              expect.objectContaining({
                title: "test",
                unit_price: 100,
              }),
            ]),
          }),
          expect.objectContaining({
            currency_code: "usd",
            items: expect.arrayContaining([
              expect.objectContaining({
                title: "test-2",
                unit_price: 200,
              }),
            ]),
          }),
        ])
      )
    })
  })

  describe("update", () => {
    it("should throw an error if cart does not exist", async () => {
      const error = await service
        .update([
          {
            id: "none-existing",
          },
        ])
        .catch((e) => e)

      expect(error.message).toContain('Cart with id "none-existing" not found')
    })

    it("should update a cart successfully", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [updatedCart] = await service.update([
        {
          id: createdCart.id,
          email: "test@email.com",
        },
      ])

      const [cart] = await service.list({ id: [createdCart.id] })

      expect(cart).toEqual(
        expect.objectContaining({
          id: createdCart.id,
          currency_code: "eur",
          email: updatedCart.email,
        })
      )
    })
  })

  describe("delete", () => {
    it("should delete a cart successfully", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      await service.delete([createdCart.id])

      const carts = await service.list({ id: [createdCart.id] })

      expect(carts.length).toEqual(0)
    })
  })

  describe("createAddresses", () => {
    it("should create an address successfully", async () => {
      const [createdAddress] = await service.createAddresses([
        {
          first_name: "John",
        },
      ])

      const [address] = await service.listAddresses({
        id: [createdAddress.id!],
      })

      expect(address).toEqual(
        expect.objectContaining({
          id: createdAddress.id,
          first_name: "John",
        })
      )
    })
  })

  describe("updateAddresses", () => {
    it("should update an address successfully", async () => {
      const [createdAddress] = await service.createAddresses([
        {
          first_name: "John",
        },
      ])

      const [updatedAddress] = await service.updateAddresses([
        { id: createdAddress.id!, first_name: "Jane" },
      ])

      expect(updatedAddress).toEqual(
        expect.objectContaining({
          id: createdAddress.id,
          first_name: "Jane",
        })
      )
    })
  })

  describe("deleteAddresses", () => {
    it("should delete an address successfully", async () => {
      const [createdAddress] = await service.createAddresses([
        {
          first_name: "John",
        },
      ])

      await service.deleteAddresses([createdAddress.id!])

      const [address] = await service.listAddresses({
        id: [createdAddress.id!],
      })

      expect(address).toBe(undefined)
    })
  })

  describe("addLineItems", () => {
    it("should add a line item to cart succesfully", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const items = await service.addLineItems(createdCart.id, [
        {
          quantity: 1,
          unit_price: 100,
          title: "test",
        },
      ])

      const cart = await service.retrieve(createdCart.id, {
        relations: ["items"],
      })

      expect(items[0]).toEqual(
        expect.objectContaining({
          title: "test",
          quantity: 1,
          unit_price: 100,
        })
      )
      expect(cart.items?.length).toBe(1)
    })

    it("should add multiple line items to cart succesfully", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      await service.addLineItems([
        {
          quantity: 1,
          unit_price: 100,
          title: "test",
          cart_id: createdCart.id,
        },
        {
          quantity: 2,
          unit_price: 200,
          title: "test-2",
          cart_id: createdCart.id,
        },
      ])

      const cart = await service.retrieve(createdCart.id, {
        relations: ["items"],
      })

      expect(cart.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: "test",
            quantity: 1,
            unit_price: 100,
          }),
          expect.objectContaining({
            title: "test-2",
            quantity: 2,
            unit_price: 200,
          }),
        ])
      )

      expect(cart.items?.length).toBe(2)
    })

    it("should add multiple line items to multiple carts succesfully", async () => {
      let [eurCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      let [usdCart] = await service.create([
        {
          currency_code: "usd",
        },
      ])

      const items = await service.addLineItems([
        {
          cart_id: eurCart.id,
          quantity: 1,
          unit_price: 100,
          title: "test",
        },
        {
          cart_id: usdCart.id,
          quantity: 1,
          unit_price: 100,
          title: "test",
        },
      ])

      const carts = await service.list(
        { id: [eurCart.id, usdCart.id] },
        { relations: ["items"] }
      )

      eurCart = carts.find((c) => c.currency_code === "eur")!
      usdCart = carts.find((c) => c.currency_code === "usd")!

      const eurItems = items.filter((i) => i.cart_id === eurCart.id)
      const usdItems = items.filter((i) => i.cart_id === usdCart.id)

      expect(eurCart.items![0].id).toBe(eurItems[0].id)
      expect(usdCart.items![0].id).toBe(usdItems[0].id)

      expect(eurCart.items?.length).toBe(1)
      expect(usdCart.items?.length).toBe(1)
    })

    it("should throw if cart does not exist", async () => {
      const error = await service
        .addLineItems("foo", [
          {
            quantity: 1,
            unit_price: 100,
            title: "test",
            tax_lines: [],
          },
        ])
        .catch((e) => e)

      expect(error.message).toContain("Cart with id: foo was not found")
    })

    it("should throw an error when required params are not passed adding to a single cart", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const error = await service
        .addLineItems(createdCart.id, [
          {
            unit_price: 10,
            title: "test",
          },
        ] as any)
        .catch((e) => e)

      expect(error.message).toContain(
        "Value for LineItem.quantity is required, 'undefined' found"
      )
    })

    it("should throw a generic error when required params are not passed using bulk add method", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const error = await service
        .addLineItems([
          {
            cart_id: createdCart.id,
            unit_price: 10,
            title: "test",
          },
        ] as any)
        .catch((e) => e)

      expect(error.message).toContain(
        "Value for LineItem.quantity is required, 'undefined' found"
      )
    })
  })

  describe("updateLineItems", () => {
    it("should update a line item in cart succesfully with selector approach", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [item] = await service.addLineItems(createdCart.id, [
        {
          quantity: 1,
          unit_price: 100,
          title: "test",
          tax_lines: [],
        },
      ])

      expect(item.title).toBe("test")

      const [updatedItem] = await service.updateLineItems(
        { cart_id: createdCart.id },
        {
          title: "test2",
        }
      )

      expect(updatedItem.title).toBe("test2")
    })

    it("should update a line item in cart succesfully with id approach", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [item] = await service.addLineItems(createdCart.id, [
        {
          quantity: 1,
          unit_price: 100,
          title: "test",
          tax_lines: [],
        },
      ])

      expect(item.title).toBe("test")

      const updatedItem = await service.updateLineItems(item.id, {
        title: "test2",
      })

      expect(updatedItem.title).toBe("test2")
    })

    it("should update line items in carts succesfully with multi-selector approach", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const items = await service.addLineItems(createdCart.id, [
        {
          quantity: 1,
          unit_price: 100,
          title: "test",
        },
        {
          quantity: 2,
          unit_price: 200,
          title: "other-test",
        },
      ])

      expect(items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: "test",
            quantity: 1,
            unit_price: 100,
          }),
          expect.objectContaining({
            title: "other-test",
            quantity: 2,
            unit_price: 200,
          }),
        ])
      )

      const itemOne = items.find((i) => i.title === "test")
      const itemTwo = items.find((i) => i.title === "other-test")

      const updatedItems = await service.updateLineItems([
        {
          selector: { cart_id: createdCart.id },
          data: {
            title: "changed-test",
          },
        },
        {
          selector: { id: itemTwo!.id },
          data: {
            title: "changed-other-test",
          },
        },
      ])

      expect(updatedItems).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: "changed-test",
            quantity: 1,
            unit_price: 100,
          }),
          expect.objectContaining({
            title: "changed-other-test",
            quantity: 2,
            unit_price: 200,
          }),
        ])
      )
    })
  })

  describe("removeLineItems", () => {
    it("should remove a line item succesfully", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [item] = await service.addLineItems(createdCart.id, [
        {
          quantity: 1,
          unit_price: 100,
          title: "test",
          tax_lines: [],
        },
      ])

      expect(item.title).toBe("test")

      await service.removeLineItems([item.id])

      const cart = await service.retrieve(createdCart.id, {
        relations: ["items"],
      })

      expect(cart.items?.length).toBe(0)
    })

    it("should remove multiple line items succesfully", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [item, item2] = await service.addLineItems(createdCart.id, [
        {
          quantity: 1,
          unit_price: 100,
          title: "test",
        },
        {
          quantity: 1,
          unit_price: 100,
          title: "test-2",
        },
      ])

      await service.removeLineItems([item.id, item2.id])

      const cart = await service.retrieve(createdCart.id, {
        relations: ["items"],
      })

      expect(cart.items?.length).toBe(0)
    })
  })

  describe("addShippingMethods", () => {
    it("should add a shipping method to cart succesfully", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [method] = await service.addShippingMethods(createdCart.id, [
        {
          amount: 100,
          name: "Test",
        },
      ])

      const cart = await service.retrieve(createdCart.id, {
        relations: ["shipping_methods"],
      })

      expect(method.id).toBe(cart.shipping_methods![0].id)
    })

    it("should throw when amount is negative", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const error = await service
        .addShippingMethods(createdCart.id, [
          {
            amount: -100,
            name: "Test",
          },
        ])
        .catch((e) => e)

      expect(error.name).toBe(CheckConstraintViolationException.name)
    })

    it("should add multiple shipping methods to multiple carts succesfully", async () => {
      let [eurCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      let [usdCart] = await service.create([
        {
          currency_code: "usd",
        },
      ])

      const methods = await service.addShippingMethods([
        {
          cart_id: eurCart.id,
          amount: 100,
          name: "Test One",
        },
        {
          cart_id: usdCart.id,
          amount: 100,
          name: "Test One",
        },
      ])

      const carts = await service.list(
        { id: [eurCart.id, usdCart.id] },
        { relations: ["shipping_methods"] }
      )

      eurCart = carts.find((c) => c.currency_code === "eur")!
      usdCart = carts.find((c) => c.currency_code === "usd")!

      const eurMethods = methods.filter((m) => m.cart_id === eurCart.id)
      const usdMethods = methods.filter((m) => m.cart_id === usdCart.id)

      expect(eurCart.shipping_methods![0].id).toBe(eurMethods[0].id)
      expect(usdCart.shipping_methods![0].id).toBe(usdMethods[0].id)

      expect(eurCart.shipping_methods?.length).toBe(1)
      expect(usdCart.shipping_methods?.length).toBe(1)
    })
  })

  describe("removeShippingMethods", () => {
    it("should remove a line item succesfully", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [method] = await service.addShippingMethods(createdCart.id, [
        {
          amount: 100,
          name: "test",
        },
      ])

      expect(method.id).not.toBe(null)

      await service.removeShippingMethods(method.id)

      const cart = await service.retrieve(createdCart.id, {
        relations: ["shipping_methods"],
      })

      expect(cart.shipping_methods?.length).toBe(0)
    })
  })

  describe("setLineItemAdjustments", () => {
    it("should set line item adjustments for a cart", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [itemOne] = await service.addLineItems(createdCart.id, [
        {
          quantity: 1,
          unit_price: 100,
          title: "test",
        },
      ])

      const [itemTwo] = await service.addLineItems(createdCart.id, [
        {
          quantity: 2,
          unit_price: 200,
          title: "test-2",
        },
      ])

      const adjustments = await service.setLineItemAdjustments(createdCart.id, [
        {
          item_id: itemOne.id,
          amount: 100,
          code: "FREE",
        },
        {
          item_id: itemTwo.id,
          amount: 200,
          code: "FREE-2",
        },
      ])

      expect(adjustments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            item_id: itemOne.id,
            amount: 100,
            code: "FREE",
          }),
          expect.objectContaining({
            item_id: itemTwo.id,
            amount: 200,
            code: "FREE-2",
          }),
        ])
      )
    })

    it("should replace line item adjustments for a cart", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [itemOne] = await service.addLineItems(createdCart.id, [
        {
          quantity: 1,
          unit_price: 100,
          title: "test",
        },
      ])

      const adjustments = await service.setLineItemAdjustments(createdCart.id, [
        {
          item_id: itemOne.id,
          amount: 100,
          code: "FREE",
        },
      ])

      expect(adjustments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            item_id: itemOne.id,
            amount: 100,
            code: "FREE",
          }),
        ])
      )

      await service.setLineItemAdjustments(createdCart.id, [
        {
          item_id: itemOne.id,
          amount: 50,
          code: "50%",
        },
      ])

      const cart = await service.retrieve(createdCart.id, {
        relations: ["items.adjustments"],
      })

      expect(cart.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: itemOne.id,
            adjustments: expect.arrayContaining([
              expect.objectContaining({
                item_id: itemOne.id,
                amount: 50,
                code: "50%",
              }),
            ]),
          }),
        ])
      )

      expect(cart.items?.length).toBe(1)
      expect(cart.items?.[0].adjustments?.length).toBe(1)
    })

    it("should remove all line item adjustments for a cart", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [itemOne] = await service.addLineItems(createdCart.id, [
        {
          quantity: 1,
          unit_price: 100,
          title: "test",
        },
      ])

      const adjustments = await service.setLineItemAdjustments(createdCart.id, [
        {
          item_id: itemOne.id,
          amount: 100,
          code: "FREE",
        },
      ])

      expect(adjustments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            item_id: itemOne.id,
            amount: 100,
            code: "FREE",
          }),
        ])
      )

      await service.setLineItemAdjustments(createdCart.id, [])

      const cart = await service.retrieve(createdCart.id, {
        relations: ["items.adjustments"],
      })

      expect(cart.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: itemOne.id,
            adjustments: [],
          }),
        ])
      )

      expect(cart.items?.length).toBe(1)
      expect(cart.items?.[0].adjustments?.length).toBe(0)
    })

    it("should update line item adjustments for a cart", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [itemOne] = await service.addLineItems(createdCart.id, [
        {
          quantity: 1,
          unit_price: 100,
          title: "test",
        },
      ])

      const adjustments = await service.setLineItemAdjustments(createdCart.id, [
        {
          item_id: itemOne.id,
          amount: 100,
          code: "FREE",
        },
      ])

      expect(adjustments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            item_id: itemOne.id,
            amount: 100,
            code: "FREE",
          }),
        ])
      )

      await service.setLineItemAdjustments(createdCart.id, [
        {
          id: adjustments[0].id,
          item_id: itemOne.id,
          amount: 50,
          code: "50%",
        },
      ])

      const cart = await service.retrieve(createdCart.id, {
        relations: ["items.adjustments"],
      })

      expect(cart.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: itemOne.id,
            adjustments: [
              expect.objectContaining({
                id: adjustments[0].id,
                item_id: itemOne.id,
                amount: 50,
                code: "50%",
              }),
            ],
          }),
        ])
      )

      expect(cart.items?.length).toBe(1)
      expect(cart.items?.[0].adjustments?.length).toBe(1)
    })
  })

  describe("addLineItemAdjustments", () => {
    it("should add line item adjustments for items in a cart", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [itemOne] = await service.addLineItems(createdCart.id, [
        {
          quantity: 1,
          unit_price: 100,
          title: "test",
        },
      ])

      const adjustments = await service.addLineItemAdjustments(createdCart.id, [
        {
          item_id: itemOne.id,
          amount: 100,
          code: "FREE",
        },
      ])

      expect(adjustments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            item_id: itemOne.id,
            amount: 100,
            code: "FREE",
          }),
        ])
      )
    })

    it("should add multiple line item adjustments for multiple line items", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [itemOne] = await service.addLineItems(createdCart.id, [
        {
          quantity: 1,
          unit_price: 100,
          title: "test",
        },
      ])
      const [itemTwo] = await service.addLineItems(createdCart.id, [
        {
          quantity: 2,
          unit_price: 200,
          title: "test-2",
        },
      ])

      const adjustments = await service.addLineItemAdjustments(createdCart.id, [
        {
          item_id: itemOne.id,
          amount: 100,
          code: "FREE",
        },
        {
          item_id: itemTwo.id,
          amount: 150,
          code: "CODE-2",
        },
      ])

      expect(adjustments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            item_id: itemOne.id,
            amount: 100,
            code: "FREE",
          }),
          expect.objectContaining({
            item_id: itemTwo.id,
            amount: 150,
            code: "CODE-2",
          }),
        ])
      )
    })

    it("should add line item adjustments for line items on multiple carts", async () => {
      const [cartOne] = await service.create([
        {
          currency_code: "eur",
        },
      ])
      const [cartTwo] = await service.create([
        {
          currency_code: "usd",
        },
      ])

      const [itemOne] = await service.addLineItems(cartOne.id, [
        {
          quantity: 1,
          unit_price: 100,
          title: "test",
        },
      ])
      const [itemTwo] = await service.addLineItems(cartTwo.id, [
        {
          quantity: 2,
          unit_price: 200,
          title: "test-2",
        },
      ])

      await service.addLineItemAdjustments([
        // item from cart one
        {
          item_id: itemOne.id,
          amount: 100,
          code: "FREE",
        },
        // item from cart two
        {
          item_id: itemTwo.id,
          amount: 150,
          code: "CODE-2",
        },
      ])

      const cartOneItems = await service.listLineItems(
        { cart_id: cartOne.id },
        { relations: ["adjustments"] }
      )
      const cartTwoItems = await service.listLineItems(
        { cart_id: cartTwo.id },
        { relations: ["adjustments"] }
      )

      expect(cartOneItems).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            adjustments: expect.arrayContaining([
              expect.objectContaining({
                item_id: itemOne.id,
                amount: 100,
                code: "FREE",
              }),
            ]),
          }),
        ])
      )
      expect(cartTwoItems).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            adjustments: expect.arrayContaining([
              expect.objectContaining({
                item_id: itemTwo.id,
                amount: 150,
                code: "CODE-2",
              }),
            ]),
          }),
        ])
      )
    })
  })

  describe("removeLineItemAdjustments", () => {
    it("should remove a line item succesfully", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [item] = await service.addLineItems(createdCart.id, [
        {
          quantity: 1,
          unit_price: 100,
          title: "test",
        },
      ])

      const [adjustment] = await service.addLineItemAdjustments(
        createdCart.id,
        [
          {
            item_id: item.id,
            amount: 50,
          },
        ]
      )

      expect(adjustment.item_id).toBe(item.id)

      await service.removeLineItemAdjustments(adjustment.id)

      const adjustments = await service.listLineItemAdjustments({
        item_id: item.id,
      })

      expect(adjustments?.length).toBe(0)
    })

    it("should remove a line item succesfully with selector", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [item] = await service.addLineItems(createdCart.id, [
        {
          quantity: 1,
          unit_price: 100,
          title: "test",
        },
      ])

      const [adjustment] = await service.addLineItemAdjustments(
        createdCart.id,
        [
          {
            item_id: item.id,
            amount: 50,
          },
        ]
      )

      expect(adjustment.item_id).toBe(item.id)

      await service.removeLineItemAdjustments({ item_id: item.id })

      const adjustments = await service.listLineItemAdjustments({
        item_id: item.id,
      })

      expect(adjustments?.length).toBe(0)
    })
  })

  describe("setShippingMethodAdjustments", () => {
    it("should set shipping method adjustments for a cart", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [shippingMethodOne] = await service.addShippingMethods(
        createdCart.id,
        [
          {
            amount: 100,
            name: "test",
          },
        ]
      )

      const [shippingMethodTwo] = await service.addShippingMethods(
        createdCart.id,
        [
          {
            amount: 200,
            name: "test-2",
          },
        ]
      )

      const adjustments = await service.setShippingMethodAdjustments(
        createdCart.id,
        [
          {
            shipping_method_id: shippingMethodOne.id,
            amount: 100,
            code: "FREE",
          },
          {
            shipping_method_id: shippingMethodTwo.id,
            amount: 200,
            code: "FREE-2",
          },
        ]
      )

      expect(adjustments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            shipping_method_id: shippingMethodOne.id,
            amount: 100,
            code: "FREE",
          }),
          expect.objectContaining({
            shipping_method_id: shippingMethodTwo.id,
            amount: 200,
            code: "FREE-2",
          }),
        ])
      )
    })

    it("should replace shipping method adjustments for a cart", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [shippingMethodOne] = await service.addShippingMethods(
        createdCart.id,
        [
          {
            amount: 100,
            name: "test",
          },
        ]
      )

      const adjustments = await service.setShippingMethodAdjustments(
        createdCart.id,
        [
          {
            shipping_method_id: shippingMethodOne.id,
            amount: 100,
            code: "FREE",
          },
        ]
      )

      expect(adjustments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            shipping_method_id: shippingMethodOne.id,
            amount: 100,
            code: "FREE",
          }),
        ])
      )

      await service.setShippingMethodAdjustments(createdCart.id, [
        {
          shipping_method_id: shippingMethodOne.id,
          amount: 50,
          code: "50%",
        },
      ])

      const cart = await service.retrieve(createdCart.id, {
        relations: ["shipping_methods.adjustments"],
      })

      expect(cart.shipping_methods).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: shippingMethodOne.id,
            cart_id: createdCart.id,
            adjustments: expect.arrayContaining([
              expect.objectContaining({
                shipping_method_id: shippingMethodOne.id,
                amount: 50,
                code: "50%",
              }),
            ]),
          }),
        ])
      )

      expect(cart.shipping_methods?.length).toBe(1)
      expect(cart.shipping_methods?.[0].adjustments?.length).toBe(1)
    })

    it("should remove all shipping method adjustments for a cart", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [shippingMethodOne] = await service.addShippingMethods(
        createdCart.id,
        [
          {
            amount: 100,
            name: "test",
          },
        ]
      )

      const adjustments = await service.setShippingMethodAdjustments(
        createdCart.id,
        [
          {
            shipping_method_id: shippingMethodOne.id,
            amount: 100,
            code: "FREE",
          },
        ]
      )

      expect(adjustments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            shipping_method_id: shippingMethodOne.id,
            amount: 100,
            code: "FREE",
          }),
        ])
      )

      await service.setShippingMethodAdjustments(createdCart.id, [])

      const cart = await service.retrieve(createdCart.id, {
        relations: ["shipping_methods.adjustments"],
      })

      expect(cart.shipping_methods).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: shippingMethodOne.id,
            adjustments: [],
          }),
        ])
      )

      expect(cart.shipping_methods?.length).toBe(1)
      expect(cart.shipping_methods?.[0].adjustments?.length).toBe(0)
    })

    it("should update shipping method adjustments for a cart", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [shippingMethodOne] = await service.addShippingMethods(
        createdCart.id,
        [
          {
            amount: 100,
            name: "test",
          },
        ]
      )

      const adjustments = await service.setShippingMethodAdjustments(
        createdCart.id,
        [
          {
            shipping_method_id: shippingMethodOne.id,
            amount: 100,
            code: "FREE",
          },
        ]
      )

      expect(adjustments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            shipping_method_id: shippingMethodOne.id,
            amount: 100,
            code: "FREE",
          }),
        ])
      )

      await service.setShippingMethodAdjustments(createdCart.id, [
        {
          id: adjustments[0].id,
          amount: 50,
          code: "50%",
        },
      ])

      const cart = await service.retrieve(createdCart.id, {
        relations: ["shipping_methods.adjustments"],
      })

      expect(cart.shipping_methods).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: shippingMethodOne.id,
            adjustments: [
              expect.objectContaining({
                id: adjustments[0].id,
                shipping_method_id: shippingMethodOne.id,
                amount: 50,
                code: "50%",
              }),
            ],
          }),
        ])
      )

      expect(cart.shipping_methods?.length).toBe(1)
      expect(cart.shipping_methods?.[0].adjustments?.length).toBe(1)
    })
  })

  describe("addShippingMethodAdjustments", () => {
    it("should add shipping method adjustments in a cart", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [shippingMethodOne] = await service.addShippingMethods(
        createdCart.id,
        [
          {
            amount: 100,
            name: "test",
          },
        ]
      )

      const adjustments = await service.addShippingMethodAdjustments(
        createdCart.id,
        [
          {
            shipping_method_id: shippingMethodOne.id,
            amount: 100,
            code: "FREE",
          },
        ]
      )

      expect(adjustments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            shipping_method_id: shippingMethodOne.id,
            amount: 100,
            code: "FREE",
          }),
        ])
      )
    })

    it("should add multiple shipping method adjustments for multiple shipping methods", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [shippingMethodOne] = await service.addShippingMethods(
        createdCart.id,
        [
          {
            amount: 100,
            name: "test",
          },
        ]
      )
      const [shippingMethodTwo] = await service.addShippingMethods(
        createdCart.id,
        [
          {
            amount: 200,
            name: "test-2",
          },
        ]
      )

      const adjustments = await service.addShippingMethodAdjustments(
        createdCart.id,
        [
          {
            shipping_method_id: shippingMethodOne.id,
            amount: 100,
            code: "FREE",
          },
          {
            shipping_method_id: shippingMethodTwo.id,
            amount: 150,
            code: "CODE-2",
          },
        ]
      )

      expect(adjustments).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            shipping_method_id: shippingMethodOne.id,
            amount: 100,
            code: "FREE",
          }),
          expect.objectContaining({
            shipping_method_id: shippingMethodTwo.id,
            amount: 150,
            code: "CODE-2",
          }),
        ])
      )
    })

    it("should add shipping method adjustments for shipping methods on multiple carts", async () => {
      const [cartOne] = await service.create([
        {
          currency_code: "eur",
        },
      ])
      const [cartTwo] = await service.create([
        {
          currency_code: "usd",
        },
      ])

      const [shippingMethodOne] = await service.addShippingMethods(cartOne.id, [
        {
          amount: 100,
          name: "test",
        },
      ])
      const [shippingMethodTwo] = await service.addShippingMethods(cartTwo.id, [
        {
          amount: 200,
          name: "test-2",
        },
      ])

      await service.addShippingMethodAdjustments([
        // item from cart one
        {
          shipping_method_id: shippingMethodOne.id,
          amount: 100,
          code: "FREE",
        },
        // item from cart two
        {
          shipping_method_id: shippingMethodTwo.id,
          amount: 150,
          code: "CODE-2",
        },
      ])

      const cartOneMethods = await service.listShippingMethods(
        { cart_id: cartOne.id },
        { relations: ["adjustments"] }
      )

      const cartTwoMethods = await service.listShippingMethods(
        { cart_id: cartTwo.id },
        { relations: ["adjustments"] }
      )

      expect(cartOneMethods).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            adjustments: expect.arrayContaining([
              expect.objectContaining({
                shipping_method_id: shippingMethodOne.id,
                amount: 100,
                code: "FREE",
              }),
            ]),
          }),
        ])
      )
      expect(cartTwoMethods).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            adjustments: expect.arrayContaining([
              expect.objectContaining({
                shipping_method_id: shippingMethodTwo.id,
                amount: 150,
                code: "CODE-2",
              }),
            ]),
          }),
        ])
      )
    })

    it("should throw if shipping method is not associated with cart", async () => {
      const [cartOne] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [cartTwo] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [shippingMethodOne] = await service.addShippingMethods(cartOne.id, [
        {
          amount: 100,
          name: "test",
        },
      ])

      const error = await service
        .addShippingMethodAdjustments(cartTwo.id, [
          {
            shipping_method_id: shippingMethodOne.id,
            amount: 100,
            code: "FREE",
          },
        ])
        .catch((e) => e)

      expect(error.message).toBe(
        `Shipping method with id ${shippingMethodOne.id} does not exist on cart with id ${cartTwo.id}`
      )
    })
  })

  describe("removeShippingMethodAdjustments", () => {
    it("should remove a shipping method succesfully", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [method] = await service.addShippingMethods(createdCart.id, [
        {
          amount: 100,
          name: "test",
        },
      ])

      const [adjustment] = await service.addShippingMethodAdjustments(
        createdCart.id,
        [
          {
            shipping_method_id: method.id,
            amount: 50,
            code: "50%",
          },
        ]
      )

      expect(adjustment.shipping_method_id).toBe(method.id)

      await service.removeShippingMethodAdjustments(adjustment.id)

      const adjustments = await service.listShippingMethodAdjustments({
        shipping_method_id: method.id,
      })

      expect(adjustments?.length).toBe(0)
    })

    it("should remove a shipping method succesfully with selector", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [shippingMethod] = await service.addShippingMethods(
        createdCart.id,
        [
          {
            amount: 100,
            name: "test",
          },
        ]
      )

      const [adjustment] = await service.addShippingMethodAdjustments(
        createdCart.id,
        [
          {
            shipping_method_id: shippingMethod.id,
            amount: 50,
            code: "50%",
          },
        ]
      )

      expect(adjustment.shipping_method_id).toBe(shippingMethod.id)

      await service.removeShippingMethodAdjustments({
        shipping_method_id: shippingMethod.id,
      })

      const adjustments = await service.listShippingMethodAdjustments({
        shipping_method_id: shippingMethod.id,
      })

      expect(adjustments?.length).toBe(0)
    })
  })

  describe("setLineItemTaxLines", () => {
    it("should set line item tax lines for a cart", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [itemOne] = await service.addLineItems(createdCart.id, [
        {
          quantity: 1,
          unit_price: 100,
          title: "test",
        },
      ])

      const [itemTwo] = await service.addLineItems(createdCart.id, [
        {
          quantity: 2,
          unit_price: 200,
          title: "test-2",
        },
      ])

      const taxLines = await service.setLineItemTaxLines(createdCart.id, [
        {
          item_id: itemOne.id,
          rate: 20,
          code: "TX",
        },
        {
          item_id: itemTwo.id,
          rate: 20,
          code: "TX",
        },
      ])

      expect(taxLines).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            item_id: itemOne.id,
            rate: 20,
            code: "TX",
          }),
          expect.objectContaining({
            item_id: itemTwo.id,
            rate: 20,
            code: "TX",
          }),
        ])
      )
    })

    it("should replace line item tax lines for a cart", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [itemOne] = await service.addLineItems(createdCart.id, [
        {
          quantity: 1,
          unit_price: 100,
          title: "test",
        },
      ])

      const taxLines = await service.setLineItemTaxLines(createdCart.id, [
        {
          item_id: itemOne.id,
          rate: 20,
          code: "TX",
        },
      ])

      expect(taxLines).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            item_id: itemOne.id,
            rate: 20,
            code: "TX",
          }),
        ])
      )

      await service.setLineItemTaxLines(createdCart.id, [
        {
          item_id: itemOne.id,
          rate: 25,
          code: "TX-2",
        },
      ])

      const cart = await service.retrieve(createdCart.id, {
        relations: ["items.tax_lines"],
      })

      expect(cart.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: itemOne.id,
            tax_lines: expect.arrayContaining([
              expect.objectContaining({
                item_id: itemOne.id,
                rate: 25,
                code: "TX-2",
              }),
            ]),
          }),
        ])
      )

      expect(cart.items?.length).toBe(1)
      expect(cart.items?.[0].tax_lines?.length).toBe(1)
    })

    it("should remove all line item tax lines for a cart", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [itemOne] = await service.addLineItems(createdCart.id, [
        {
          quantity: 1,
          unit_price: 100,
          title: "test",
        },
      ])

      const taxLines = await service.setLineItemTaxLines(createdCart.id, [
        {
          item_id: itemOne.id,
          rate: 20,
          code: "TX",
        },
      ])

      expect(taxLines).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            item_id: itemOne.id,
            rate: 20,
            code: "TX",
          }),
        ])
      )

      await service.setLineItemTaxLines(createdCart.id, [])

      const cart = await service.retrieve(createdCart.id, {
        relations: ["items.tax_lines"],
      })

      expect(cart.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: itemOne.id,
            tax_lines: [],
          }),
        ])
      )

      expect(cart.items?.length).toBe(1)
      expect(cart.items?.[0].tax_lines?.length).toBe(0)
    })

    it("should update line item tax lines for a cart", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [itemOne] = await service.addLineItems(createdCart.id, [
        {
          quantity: 1,
          unit_price: 100,
          title: "test",
        },
      ])

      const taxLines = await service.setLineItemTaxLines(createdCart.id, [
        {
          item_id: itemOne.id,
          rate: 20,
          code: "TX",
        },
      ])

      expect(taxLines).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            item_id: itemOne.id,
            rate: 20,
            code: "TX",
          }),
        ])
      )

      await service.setLineItemTaxLines(createdCart.id, [
        {
          id: taxLines[0].id,
          item_id: itemOne.id,
          rate: 25,
          code: "TX",
        },
      ])

      const cart = await service.retrieve(createdCart.id, {
        relations: ["items.tax_lines"],
      })

      expect(cart.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: itemOne.id,
            tax_lines: [
              expect.objectContaining({
                id: taxLines[0].id,
                item_id: itemOne.id,
                rate: 25,
                code: "TX",
              }),
            ],
          }),
        ])
      )

      expect(cart.items?.length).toBe(1)
      expect(cart.items?.[0].tax_lines?.length).toBe(1)
    })

    it("should remove, update, and create line item tax lines for a cart", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [itemOne] = await service.addLineItems(createdCart.id, [
        {
          quantity: 1,
          unit_price: 100,
          title: "test",
        },
      ])

      const taxLines = await service.setLineItemTaxLines(createdCart.id, [
        {
          item_id: itemOne.id,
          rate: 20,
          code: "TX",
        },
        {
          item_id: itemOne.id,
          rate: 25,
          code: "TX",
        },
      ])

      expect(taxLines).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            item_id: itemOne.id,
            rate: 20,
            code: "TX",
          }),
          expect.objectContaining({
            item_id: itemOne.id,
            rate: 25,
            code: "TX",
          }),
        ])
      )

      const taxLine = taxLines.find((tx) => tx.item_id === itemOne.id)

      await service.setLineItemTaxLines(createdCart.id, [
        // update
        {
          id: taxLine.id,
          rate: 40,
          code: "TX",
        },
        // create
        {
          item_id: itemOne.id,
          rate: 25,
          code: "TX-2",
        },
        // remove: should remove the initial tax line for itemOne
      ])

      const cart = await service.retrieve(createdCart.id, {
        relations: ["items.tax_lines"],
      })

      expect(cart.items).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: itemOne.id,
            tax_lines: [
              expect.objectContaining({
                id: taxLine!.id,
                item_id: itemOne.id,
                rate: 40,
                code: "TX",
              }),
              expect.objectContaining({
                item_id: itemOne.id,
                rate: 25,
                code: "TX-2",
              }),
            ],
          }),
        ])
      )

      expect(cart.items?.length).toBe(1)
      expect(cart.items?.[0].tax_lines?.length).toBe(2)
    })
  })

  describe("addLineItemAdjustments", () => {
    it("should add line item tax lines for items in a cart", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [itemOne] = await service.addLineItems(createdCart.id, [
        {
          quantity: 1,
          unit_price: 100,
          title: "test",
        },
      ])

      const taxLines = await service.addLineItemTaxLines(createdCart.id, [
        {
          item_id: itemOne.id,
          rate: 20,
          code: "TX",
        },
      ])

      expect(taxLines).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            item_id: itemOne.id,
            rate: 20,
            code: "TX",
          }),
        ])
      )
    })

    it("should add multiple line item tax lines for multiple line items", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [itemOne] = await service.addLineItems(createdCart.id, [
        {
          quantity: 1,
          unit_price: 100,
          title: "test",
        },
      ])
      const [itemTwo] = await service.addLineItems(createdCart.id, [
        {
          quantity: 2,
          unit_price: 200,
          title: "test-2",
        },
      ])

      const taxLines = await service.addLineItemTaxLines(createdCart.id, [
        {
          item_id: itemOne.id,
          rate: 20,
          code: "TX",
        },
        {
          item_id: itemTwo.id,
          rate: 20,
          code: "TX",
        },
      ])

      expect(taxLines).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            item_id: itemOne.id,
            rate: 20,
            code: "TX",
          }),
          expect.objectContaining({
            item_id: itemTwo.id,
            rate: 20,
            code: "TX",
          }),
        ])
      )
    })

    it("should add line item tax lines for line items on multiple carts", async () => {
      const [cartOne] = await service.create([
        {
          currency_code: "eur",
        },
      ])
      const [cartTwo] = await service.create([
        {
          currency_code: "usd",
        },
      ])

      const [itemOne] = await service.addLineItems(cartOne.id, [
        {
          quantity: 1,
          unit_price: 100,
          title: "test",
        },
      ])
      const [itemTwo] = await service.addLineItems(cartTwo.id, [
        {
          quantity: 2,
          unit_price: 200,
          title: "test-2",
        },
      ])

      await service.addLineItemTaxLines([
        // item from cart one
        {
          item_id: itemOne.id,
          rate: 20,
          code: "TX",
        },
        // item from cart two
        {
          item_id: itemTwo.id,
          rate: 25,
          code: "TX-2",
        },
      ])

      const cartOneItems = await service.listLineItems(
        { cart_id: cartOne.id },
        { relations: ["tax_lines"] }
      )
      const cartTwoItems = await service.listLineItems(
        { cart_id: cartTwo.id },
        { relations: ["tax_lines"] }
      )

      expect(cartOneItems).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            tax_lines: expect.arrayContaining([
              expect.objectContaining({
                item_id: itemOne.id,
                rate: 20,
                code: "TX",
              }),
            ]),
          }),
        ])
      )
      expect(cartTwoItems).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            tax_lines: expect.arrayContaining([
              expect.objectContaining({
                item_id: itemTwo.id,
                rate: 25,
                code: "TX-2",
              }),
            ]),
          }),
        ])
      )
    })
  })

  describe("removeLineItemAdjustments", () => {
    it("should remove line item tax line succesfully", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [item] = await service.addLineItems(createdCart.id, [
        {
          quantity: 1,
          unit_price: 100,
          title: "test",
        },
      ])

      const [taxLine] = await service.addLineItemTaxLines(createdCart.id, [
        {
          item_id: item.id,
          rate: 20,
          code: "TX",
        },
      ])

      expect(taxLine.item_id).toBe(item.id)

      await service.removeLineItemTaxLines(taxLine.id)

      const taxLines = await service.listLineItemTaxLines({
        item_id: item.id,
      })

      expect(taxLines?.length).toBe(0)
    })

    it("should remove line item tax lines succesfully with selector", async () => {
      const [createdCart] = await service.create([
        {
          currency_code: "eur",
        },
      ])

      const [item] = await service.addLineItems(createdCart.id, [
        {
          quantity: 1,
          unit_price: 100,
          title: "test",
        },
      ])

      const [taxLine] = await service.addLineItemTaxLines(createdCart.id, [
        {
          item_id: item.id,
          rate: 20,
          code: "TX",
        },
      ])

      expect(taxLine.item_id).toBe(item.id)

      await service.removeLineItemTaxLines({ item_id: item.id })

      const taxLines = await service.listLineItemTaxLines({
        item_id: item.id,
      })

      expect(taxLines?.length).toBe(0)
    })
  })
})
