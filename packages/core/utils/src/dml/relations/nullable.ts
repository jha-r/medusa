import { RelationshipType } from "@medusajs/types"
import { IsRelationship } from "./base"

const IsNullableModifier = Symbol.for("isNullableModifier")

/**
 * Nullable modifier marks a schema node as nullable
 */
export class RelationNullableModifier<
  T,
  Relation extends RelationshipType<T>,
  ForeignKey extends boolean
> implements RelationshipType<T | null>
{
  [IsNullableModifier]: true = true;
  [IsRelationship]: true = true

  static isNullableModifier<T>(
    modifier: any
  ): modifier is RelationNullableModifier<T, any, any> {
    return !!modifier?.[IsNullableModifier]
  }

  declare type: Relation["type"]

  /**
   * A type-only property to infer the JavScript data-type
   * of the schema property
   */
  declare $dataType: T | null
  declare $foreignKey: ForeignKey

  /**
   * The parent schema on which the nullable modifier is
   * applied
   */
  #relation: Relation

  constructor(relation: Relation) {
    this.#relation = relation
    this.type = relation.type
  }

  /**
   * Returns the serialized metadata
   */
  parse(fieldName: string) {
    const relation = this.#relation.parse(fieldName)
    relation.nullable = true
    return relation
  }
}
