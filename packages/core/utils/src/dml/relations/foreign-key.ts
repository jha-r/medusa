// import { RelationshipType } from "@medusajs/types"
// import { RelationNullableModifier } from "./nullable"
// import { BaseRelationship, IsRelationship } from "./base"

// const IsForeignKeyModifier = Symbol.for("isForeignKeyModifier")

// /**
//  * ForeignKey modifier marks a schema node to have a foreign key
//  */
// export class ForeignKeyModifier<T, Relation extends RelationshipType<T>>
//   implements RelationshipType<T>
// {
//   [IsForeignKeyModifier]: true = true;
//   [IsRelationship]: true = true

//   static isRelationship<T>(
//     relationship: any
//   ): relationship is BaseRelationship<T> {
//     return !!relationship?.[IsRelationship]
//   }

//   static isForeignKeyModifier<T>(
//     modifier: any
//   ): modifier is ForeignKeyModifier<T, any> {
//     return !!modifier?.[IsForeignKeyModifier]
//   }

//   declare type: Relation["type"]

//   /**
//    * A type-only property to infer the JavScript data-type
//    * of the schema property
//    */
//   declare $dataType: T
//   declare $foreignKey: true

//   /**
//    * The parent schema on which the foreignkey modifier is
//    * applied
//    */
//   #relation: Relation

//   constructor(relation: Relation) {
//     this.#relation = relation
//     this.type = relation.type
//   }

//   /**
//    * This method indicates that the relationship is searchable
//    *
//    * @example
//    * import { model } from "@medusajs/framework/utils"
//    *
//    * const Product = model.define("Product", {
//    *   collection: model.belongsTo(() => ProductCollection).searchable(),
//    *   // ...
//    * })
//    *
//    * export default Product
//    */
//   searchable() {
//     this.#relation.searchable()
//     return this
//   }

//   /**
//    * Returns the serialized metadata
//    */
//   parse(fieldName: string) {
//     const relation = this.#relation.parse(fieldName)
//     relation.foreignKey = true
//     return relation
//   }

//   /**
//    * Apply nullable modifier on the schema
//    */
//   nullable() {
//     return new RelationNullableModifier<
//       T,
//       ForeignKeyModifier<T, Relation>,
//       true
//     >(this)
//   }
// }
