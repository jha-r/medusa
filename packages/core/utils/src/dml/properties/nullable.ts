import { PropertyType } from "@medusajs/types"
import { OptionalModifier } from "./optional"

const IsNullableModifier = Symbol.for("isNullableModifier")
/**
 * Nullable modifier marks a schema node as nullable
 */
export class NullableModifier<T, Schema extends PropertyType<NoInfer<T>>>
  implements PropertyType<T | null>
{
  [IsNullableModifier]: true = true

  static isNullableModifier(obj: any): obj is NullableModifier<any, any> {
    return !!obj?.[IsNullableModifier]
  }

  /**
   * A type-only property to infer the JavScript data-type
   * of the schema property
   */
  declare $dataType: T | null

  /**
   * The parent schema on which the nullable modifier is
   * applied
   */
  #schema: Schema

  constructor(schema: Schema) {
    this.#schema = schema
  }

  /**
   * This method indicates that a property's value can be `optional`.
   *
   * @example
   * import { model } from "@medusajs/framework/utils"
   *
   * const MyCustom = model.define("my_custom", {
   *   price: model.bigNumber().optional(),
   *   // ...
   * })
   *
   * export default MyCustom
   *
   * @customNamespace Property Configuration Methods
   */
  optional() {
    return new OptionalModifier<T | null, this>(this)
  }

  /**
   * Returns the serialized metadata
   */
  parse(fieldName: string) {
    const schema = this.#schema.parse(fieldName)
    schema.nullable = true
    return schema
  }
}
