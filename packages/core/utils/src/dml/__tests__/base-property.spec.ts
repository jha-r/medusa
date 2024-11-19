import { PropertyMetadata } from "@medusajs/types"
import { expectTypeOf } from "expect-type"
import { BaseProperty } from "../properties/base"
import { TextProperty } from "../properties/text"

describe("Base property", () => {
  test("create a property type from base property", () => {
    class StringProperty extends BaseProperty<string> {
      protected dataType: PropertyMetadata["dataType"] = {
        name: "text",
      }
    }

    const property = new StringProperty()

    expectTypeOf(property["$dataType"]).toEqualTypeOf<string>()
    expect(property.parse("username")).toEqual({
      fieldName: "username",
      dataType: {
        name: "text",
      },
      nullable: false,
      optional: false,
      indexes: [],
      relationships: [],
    })
  })

  test("apply searchable modifier", () => {
    const property = new TextProperty().searchable()

    expectTypeOf(property["$dataType"]).toEqualTypeOf<string>()
    expect(property.parse("username")).toEqual({
      fieldName: "username",
      dataType: {
        name: "text",
        options: {
          searchable: true,
        },
      },
      nullable: false,
      optional: false,
      indexes: [],
      relationships: [],
    })
  })

  test("apply nullable modifier", () => {
    class StringProperty extends BaseProperty<string> {
      protected dataType: PropertyMetadata["dataType"] = {
        name: "text",
      }
    }

    const property = new StringProperty().nullable()

    expectTypeOf(property["$dataType"]).toEqualTypeOf<string | null>()
    expect(property.parse("username")).toEqual({
      fieldName: "username",
      dataType: {
        name: "text",
      },
      nullable: true,
      optional: false,
      indexes: [],
      relationships: [],
    })
  })

  test("define default value", () => {
    class StringProperty extends BaseProperty<string> {
      protected dataType: PropertyMetadata["dataType"] = {
        name: "text",
      }
    }

    const property = new StringProperty().default("foo")

    expectTypeOf(property["$dataType"]).toEqualTypeOf<string>()
    expect(property.parse("username")).toEqual({
      fieldName: "username",
      dataType: {
        name: "text",
      },
      defaultValue: "foo",
      nullable: false,
      optional: false,
      indexes: [],
      relationships: [],
    })
  })

  test("apply optional modifier", () => {
    class StringProperty extends BaseProperty<string> {
      protected dataType: PropertyMetadata["dataType"] = {
        name: "text",
      }
    }

    const property = new StringProperty().optional()

    expectTypeOf(property["$dataType"]).toEqualTypeOf<string | undefined>()
    expect(property.parse("username")).toEqual({
      fieldName: "username",
      dataType: {
        name: "text",
      },
      nullable: false,
      optional: true,
      indexes: [],
      relationships: [],
    })
  })

  test("apply optional and nullable modifier", () => {
    class StringProperty extends BaseProperty<string> {
      protected dataType: PropertyMetadata["dataType"] = {
        name: "text",
      }
    }

    const property = new StringProperty().optional().nullable()
    expectTypeOf(property["$dataType"]).toEqualTypeOf<
      string | undefined | null
    >()
    expect(property.parse("username")).toEqual({
      fieldName: "username",
      dataType: {
        name: "text",
      },
      nullable: true,
      optional: true,
      indexes: [],
      relationships: [],
    })
  })

  test("apply nullable and optional modifier", () => {
    class StringProperty extends BaseProperty<string> {
      protected dataType: PropertyMetadata["dataType"] = {
        name: "text",
      }
    }

    const property = new StringProperty().nullable().optional()
    expectTypeOf(property["$dataType"]).toEqualTypeOf<
      string | null | undefined
    >()
    expect(property.parse("username")).toEqual({
      fieldName: "username",
      dataType: {
        name: "text",
      },
      nullable: true,
      optional: true,
      indexes: [],
      relationships: [],
    })
  })

  test("define default value as a callback", () => {
    class StringProperty extends BaseProperty<string> {
      protected dataType: PropertyMetadata["dataType"] = {
        name: "text",
      }
    }

    const property = new StringProperty().default(() => "22")

    expectTypeOf(property["$dataType"]).toEqualTypeOf<string>()
    expect(property.parse("username")).toEqual({
      fieldName: "username",
      dataType: {
        name: "text",
      },
      defaultValue: expect.any(Function),
      nullable: false,
      optional: false,
      indexes: [],
      relationships: [],
    })
  })
})
