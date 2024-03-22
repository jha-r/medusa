export enum PriceListRelations {
  PRICES = "prices",
}

export const adminPriceListRemoteQueryFields = [
  "id",
  "type",
  "description",
  "title",
  "status",
  "starts_at",
  "ends_at",
  "created_at",
  "updated_at",
  "deleted_at",
  "price_set_money_amounts.id",
  "price_set_money_amounts.currency_code",
  "price_set_money_amounts.amount",
  "price_set_money_amounts.min_quantity",
  "price_set_money_amounts.max_quantity",
  "price_set_money_amounts.created_at",
  "price_set_money_amounts.deleted_at",
  "price_set_money_amounts.updated_at",
  "price_set_money_amounts.price_set.variant.id",
  "price_set_money_amounts.price_rules.value",
  "price_set_money_amounts.price_rules.rule_type.rule_attribute",
  "price_list_rules.price_list_rule_values.value",
  "price_list_rules.rule_type.rule_attribute",
]

export const defaultAdminPriceListFields = [
  "id",
  "type",
  "description",
  "title",
  "status",
  "starts_at",
  "ends_at",
  "rules",
  "created_at",
  "updated_at",
  "prices.amount",
  "prices.id",
  "prices.currency_code",
  "prices.amount",
  "prices.min_quantity",
  "prices.max_quantity",
  "prices.variant_id",
  "prices.rules",
]

export const defaultAdminPriceListRelations = []

export const allowedAdminPriceListRelations = [PriceListRelations.PRICES]

export const adminListTransformQueryConfig = {
  defaultLimit: 50,
  defaultFields: defaultAdminPriceListFields,
  defaultRelations: defaultAdminPriceListRelations,
  allowedRelations: allowedAdminPriceListRelations,
  isList: true,
}

export const adminRetrieveTransformQueryConfig = {
  defaultFields: defaultAdminPriceListFields,
  defaultRelations: defaultAdminPriceListRelations,
  allowedRelations: allowedAdminPriceListRelations,
  isList: false,
}
