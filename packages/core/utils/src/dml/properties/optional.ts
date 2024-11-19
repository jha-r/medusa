import { PropertyType } from "@medusajs/types"
import { NullableModifier } from "./nullable"

const IsOptionalModifier = Symbol.for("IsOptionalModifier")

/**
 * Nullable modifier marks a schema node as optional and
 * allows for default values
 */
export class OptionalModifier<T, Schema extends PropertyType<T>>
  implements PropertyType<T | undefined>
{
  [IsOptionalModifier]: true = true

  static isOptionalModifier(obj: any): obj is OptionalModifier<any, any> {
    return !!obj?.[IsOptionalModifier]
  }

  /**
   * A type-only property to infer the JavScript data-type
   * of the schema property
   */
  declare $dataType: T | undefined

  /**
   * The parent schema on which the nullable modifier is
   * applied
   */
  #schema: Schema

  constructor(schema: Schema) {
    this.#schema = schema
  }

  /**
   * This method indicates that a property's value can be `null`.
   *
   * @example
   * import { model } from "@medusajs/framework/utils"
   *
   * const MyCustom = model.define("my_custom", {
   *   price: model.bigNumber().optional().nullable(),
   *   // ...
   * })
   *
   * export default MyCustom
   *
   * @customNamespace Property Configuration Methods
   */
  nullable() {
    return new NullableModifier<T | undefined, this>(this)
  }

  /**
   * Returns the serialized metadata
   */
  parse(fieldName: string) {
    const schema = this.#schema.parse(fieldName)
    schema.optional = true
    return schema
  }
}
