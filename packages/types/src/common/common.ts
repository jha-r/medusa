import {
  FindManyOptions,
  FindOneOptions,
  FindOperator,
  FindOptionsSelect,
  FindOptionsWhere,
  OrderByCondition,
} from "typeorm"

import { FindOptionsOrder } from "typeorm/find-options/FindOptionsOrder"
import { FindOptionsRelations } from "typeorm/find-options/FindOptionsRelations"

/**
 * Utility type used to remove some optional attributes (coming from K) from a type T
 */
export type WithRequiredProperty<T, K extends keyof T> = T & {
  // -? removes 'optional' from a property
  [Property in K]-?: T[Property]
}

export type PartialPick<T, K extends keyof T> = {
  [P in K]?: T[P]
}

export interface BaseEntity {
  id: string
  created_at: Date
  updated_at: Date
}

export interface SoftDeletableEntity extends BaseEntity {
  deleted_at: Date | null
}

export type Writable<T> = {
  -readonly [key in keyof T]:
    | T[key]
    | FindOperator<T[key]>
    | FindOperator<T[key][]>
    | FindOperator<string[]>
}

/**
 * @{label FindConfig}
 * 
 * An interface used to implement generic properties to select and filter items when retrieved from the database
 * 
 * @typeParam Entity - The entity whose items are selected and filtered.
 * 
 * @param select - an optional array of attributes to select from the entity.
 * @param skip - an optional number indicating the items to skip before retrieving the results.
 * @param take - an optional number indicating the items to return in the result
 * @param relations - an array of strings indicating the entity's relation to retrieve for each item.
 * @param order - 
 * an optional object to sort the items by at least one attribute. The object key is an entity's attribute name, and the value can either be `ASC` for ascending order
 * or `DESC` for descending order.
 * @param withDeleted - an optional boolean indicating whether to retrieve deleted entities as well. Only works if the entity extends the `SoftDeletableEntity` class
 */
export interface FindConfig<Entity> {
  select?: (keyof Entity | string)[]
  skip?: number
  take?: number
  relations?: string[]
  order?: { [K: string]: "ASC" | "DESC" }
  withDeleted?: boolean
}

export type ExtendedFindConfig<TEntity> = (
  | Omit<FindOneOptions<TEntity>, "where" | "relations" | "select">
  | Omit<FindManyOptions<TEntity>, "where" | "relations" | "select">
) & {
  select?: FindOptionsSelect<TEntity>
  relations?: FindOptionsRelations<TEntity>
  where: FindOptionsWhere<TEntity> | FindOptionsWhere<TEntity>[]
  order?: FindOptionsOrder<TEntity>
  skip?: number
  take?: number
}

export type QuerySelector<TEntity> = Selector<TEntity> & { q?: string }
export type TreeQuerySelector<TEntity> = QuerySelector<TEntity> & {
  include_descendants_tree?: boolean
}

export type Selector<TEntity> = {
  [key in keyof TEntity]?:
    | TEntity[key]
    | TEntity[key][]
    | DateComparisonOperator
    | StringComparisonOperator
    | NumericalComparisonOperator
    | FindOperator<TEntity[key][] | string | string[]>
}

export type TotalField =
  | "shipping_total"
  | "discount_total"
  | "tax_total"
  | "refunded_total"
  | "total"
  | "subtotal"
  | "refundable_amount"
  | "gift_card_total"
  | "gift_card_tax_total"

export interface CustomFindOptions<TModel, InKeys extends keyof TModel> {
  select?: FindManyOptions<TModel>["select"]
  where?: FindManyOptions<TModel>["where"] & {
    [P in InKeys]?: TModel[P][]
  }
  order?: OrderByCondition
  skip?: number
  take?: number
}

export type QueryConfig<TEntity extends BaseEntity> = {
  defaultFields?: (keyof TEntity | string)[]
  defaultRelations?: string[]
  allowedFields?: string[]
  allowedRelations?: string[]
  defaultLimit?: number
  isList?: boolean
}

export type RequestQueryFields = {
  expand?: string
  fields?: string
  offset?: number
  limit?: number
  order?: string
}

export type PaginatedResponse = {
  limit: number
  offset: number
  count: number
}

export type DeleteResponse = {
  id: string
  object: string
  deleted: boolean
}

export interface EmptyQueryParams {}
// TODO: Build a tree repository options from this
export interface RepositoryTransformOptions {}

export interface DateComparisonOperator {
  lt?: Date
  gt?: Date
  gte?: Date
  lte?: Date
}

export interface StringComparisonOperator {
  lt?: string
  gt?: string
  gte?: string
  lte?: string
  contains?: string
  starts_with?: string
  ends_with?: string
}

export interface NumericalComparisonOperator {
  lt?: number
  gt?: number
  gte?: number
  lte?: number
}

export interface AddressPayload {
  first_name?: string
  last_name?: string
  phone?: string
  metadata?: Record<string, unknown>
  company?: string
  address_1?: string
  address_2?: string
  city?: string
  country_code?: string
  province?: string
  postal_code?: string
}

export interface AddressCreatePayload {
  first_name: string
  last_name: string
  phone: string
  metadata: object
  company: string
  address_1: string
  address_2: string
  city: string
  country_code: string
  province: string
  postal_code: string
}

export interface FindParams {
  expand?: string
  fields?: string
}

export interface FindPaginationParams {
  offset?: number
  limit?: number
}
