import {
  IDmlEntity,
  DMLSchema,
  EntityIndex,
  CheckConstraint,
  EntityCascades,
  QueryCondition,
  IDmlEntityConfig,
  ExtractEntityRelations,
  InferDmlEntityNameFromConfig,
  InferSchemaFields,
} from "@medusajs/types"
import { isObject, isString, toCamelCase, upperCaseFirst } from "../common"
import { transformIndexWhere } from "./helpers/entity-builder/build-indexes"
import { DMLSchemaWithBigNumber } from "./helpers/entity-builder/create-big-number-properties"
import { DMLSchemaDefaults } from "./helpers/entity-builder/create-default-properties"
import { BelongsTo } from "./relations/belongs-to"

const IsDmlEntity = Symbol.for("isDmlEntity")

/**
 * @experimental
 * need to be moved after RFV
 */
type Hooks<Schema extends DMLSchema, TConfig extends IDmlEntityConfig> = {
  creating?: (entity: InferSchemaFields<Schema>) => void
}

export type DMLEntitySchemaBuilder<Schema extends DMLSchema> =
  DMLSchemaWithBigNumber<Schema> & DMLSchemaDefaults & Schema

function extractEntityConfig<const Config extends IDmlEntityConfig>(
  nameOrConfig: Config
) {
  const result = {
    name: "",
    tableName: "",
    disableSoftDeleteFilter: false,
  } as {
    name: InferDmlEntityNameFromConfig<Config>
    tableName: string
    disableSoftDeleteFilter: boolean
  }

  if (isString(nameOrConfig)) {
    const [schema, ...rest] = nameOrConfig.split(".")
    const name = rest.length ? rest.join(".") : schema
    result.name = upperCaseFirst(
      toCamelCase(name)
    ) as InferDmlEntityNameFromConfig<Config>

    result.tableName = nameOrConfig
  }

  if (isObject(nameOrConfig)) {
    if (!nameOrConfig.tableName) {
      throw new Error(
        `Missing "tableName" property in the config object for "${nameOrConfig.name}" entity`
      )
    }

    const potentialName = nameOrConfig.name ?? nameOrConfig.tableName
    const [schema, ...rest] = potentialName.split(".")
    const name = rest.length ? rest.join(".") : schema

    result.name = upperCaseFirst(
      toCamelCase(name)
    ) as InferDmlEntityNameFromConfig<Config>
    result.tableName = nameOrConfig.tableName
    result.disableSoftDeleteFilter =
      nameOrConfig.disableSoftDeleteFilter ?? false
  }

  return result
}

/**
 * Dml entity is a representation of a DML model with a unique
 * name, its schema and relationships.
 */
export class DmlEntity<
  const Schema extends DMLSchema,
  const TConfig extends IDmlEntityConfig
> implements IDmlEntity<Schema, TConfig>
{
  [IsDmlEntity] = true

  name: InferDmlEntityNameFromConfig<TConfig>
  schema: Schema

  readonly #tableName: string
  readonly #params: Record<string, unknown>

  #cascades: EntityCascades<string[]> = {}
  #indexes: EntityIndex<Schema>[] = []
  #checks: CheckConstraint<Schema>[] = []

  /**
   * @experimental
   * TODO: Write RFC about this, for now it is unstable and mainly
   * for test purposes
   */
  #hooks: Hooks<Schema, TConfig> = {}

  constructor(nameOrConfig: TConfig, schema: Schema) {
    const { name, tableName, disableSoftDeleteFilter } =
      extractEntityConfig(nameOrConfig)
    this.schema = schema
    this.name = name
    this.#tableName = tableName
    this.#params = {
      disableSoftDeleteFilter,
    }
  }

  /**
   * A static method to check if an entity is an instance of DmlEntity.
   * It allows us to identify a specific object as being an instance of
   * DmlEntity.
   *
   * @param entity
   */
  static isDmlEntity(entity: unknown): entity is DmlEntity<any, any> {
    return !!entity?.[IsDmlEntity]
  }

  /**
   * Parse entity to get its underlying information
   */
  parse(): {
    name: InferDmlEntityNameFromConfig<TConfig>
    tableName: string
    schema: DMLSchema
    cascades: EntityCascades<string[]>
    indexes: EntityIndex<Schema>[]
    params: Record<string, unknown>
    hooks: Hooks<Schema, TConfig>
    checks: CheckConstraint<Schema>[]
  } {
    return {
      name: this.name,
      tableName: this.#tableName,
      schema: this.schema,
      cascades: this.#cascades,
      indexes: this.#indexes,
      params: this.#params,
      hooks: this.#hooks,
      checks: this.#checks,
    }
  }

  /**
   * This method configures which related data models an operation, such as deletion,
   * should be cascaded to.
   *
   * For example, if a store is deleted, its product should also be deleted.
   *
   * @param options - The cascades configurations. They object's keys are the names of
   * the actions, such as `deleted`, and the value is an array of relations that the
   * action should be cascaded to.
   *
   * @example
   * import { model } from "@medusajs/framework/utils"
   *
   * const Store = model.define("store", {
   *   id: model.id(),
   *   products: model.hasMany(() => Product),
   * })
   * .cascades({
   *   delete: ["products"],
   * })
   *
   * @customNamespace Model Methods
   */
  cascades(
    options: EntityCascades<
      ExtractEntityRelations<Schema, "hasOne" | "hasMany">
    >
  ) {
    const childToParentCascades = options.delete?.filter((relationship) => {
      return BelongsTo.isBelongsTo(this.schema[relationship])
    })

    if (childToParentCascades?.length) {
      throw new Error(
        `Cannot cascade delete "${childToParentCascades.join(
          ", "
        )}" relationship(s) from "${
          this.name
        }" entity. Child to parent cascades are not allowed`
      )
    }

    this.#cascades = options
    return this
  }

  /**
   * This method defines indices on the data model. An index can be on multiple columns
   * and have conditions.
   *
   * @param indexes - The index's configuration.
   *
   * @example
   * An example of a simple index:
   *
   * ```ts
   * import { model } from "@medusajs/framework/utils"
   *
   * const MyCustom = model.define("my_custom", {
   *   id: model.id(),
   *   name: model.text(),
   *   age: model.number()
   * }).indexes([
   *   {
   *     on: ["name", "age"],
   *   },
   * ])
   *
   * export default MyCustom
   * ```
   *
   * To add a condition on the index, use the `where` option:
   *
   * ```ts
   * import { model } from "@medusajs/framework/utils"
   *
   * const MyCustom = model.define("my_custom", {
   *   id: model.id(),
   *   name: model.text(),
   *   age: model.number()
   * }).indexes([
   *   {
   *     on: ["name", "age"],
   *     where: {
   *       age: 30
   *     }
   *   },
   * ])
   *
   * export default MyCustom
   * ```
   *
   * The condition can also be a negation. For example:
   *
   * ```ts
   * import { model } from "@medusajs/framework/utils"
   *
   * const MyCustom = model.define("my_custom", {
   *   id: model.id(),
   *   name: model.text(),
   *   age: model.number()
   * }).indexes([
   *   {
   *     on: ["name", "age"],
   *     where: {
   *       age: {
   *         $ne: 30
   *       }
   *     }
   *   },
   * ])
   *
   * export default MyCustom
   * ```
   *
   * In this example, the index is created when the value of `age` doesn't equal `30`.
   *
   * @customNamespace Model Methods
   */
  indexes(indexes: EntityIndex<Schema, string | QueryCondition<Schema>>[]) {
    for (const index of indexes) {
      index.where = transformIndexWhere<Schema>(index)
      index.unique ??= false
    }

    this.#indexes = indexes as EntityIndex<Schema>[]
    return this
  }

  /**
   * @experimental
   * TODO: Write RFC about this, for now it is unstable and mainly
   * for test purposes
   * @param hooks
   * @returns
   */
  hooks(hooks: Hooks<Schema, TConfig>): this {
    this.#hooks = hooks
    return this
  }

  checks(checks: CheckConstraint<Schema>[]) {
    this.#checks = checks
    return this
  }
}
