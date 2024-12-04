import {
  RelationshipMetadata,
  RelationshipOptions,
  RelationshipType,
  RelationshipTypes,
} from "@medusajs/types"

// type Cleanup<T, Exclusion extends string[] = []> = {
//   [K in keyof T as K extends Exclusion[number]
//     ? never
//     : K]: T[K] extends RelationshipType<infer RelationResolver>
//     ? RelationResolver extends () => infer Relation ? RelationshipCleanup<Relation, [K & string, ...Exclusion]>
//     : T[K]
// }

export const IsRelationship = Symbol.for("isRelationship")

/**
 * The BaseRelationship encapsulates the repetitive parts of defining
 * a relationship
 */
export abstract class BaseRelationship<T> implements RelationshipType<T> {
  [IsRelationship]: true = true

  #searchable: boolean = false
  #referencedEntity: T

  /**
   * Configuration options for the relationship
   */
  protected options: RelationshipOptions

  /**
   * Relationship type
   */
  abstract type: RelationshipTypes

  /**
   * A type-only property to infer the JavScript data-type
   * of the relationship property
   */
  declare $dataType: T

  static isRelationship<T>(
    relationship: any
  ): relationship is BaseRelationship<T> {
    return !!relationship?.[IsRelationship]
  }

  constructor(referencedEntity: T, options: RelationshipOptions) {
    this.#referencedEntity = referencedEntity
    this.options = options
  }

  /**
   * This method indicates that the relationship is searchable
   *
   * @example
   * import { model } from "@medusajs/framework/utils"
   *
   * const Product = model.define("Product", {
   *   variants: model.hasMany(() => ProductVariant).searchable(),
   *   // ...
   * })
   *
   * export default Product
   *
   * @customNamespace Property Configuration Methods
   */
  searchable() {
    this.#searchable = true
    return this
  }

  /**
   * Returns the parsed copy of the relationship
   */
  parse(relationshipName: string): RelationshipMetadata {
    return {
      name: relationshipName,
      nullable: false,
      options: this.options,
      searchable: this.#searchable,
      entity: this.#referencedEntity,
      type: this.type,
      ...("mappedBy" in this.options
        ? { mappedBy: this.options.mappedBy }
        : {}),
    }
  }
}
