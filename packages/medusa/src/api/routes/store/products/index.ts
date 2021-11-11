import { Router } from "express"
import "reflect-metadata"
import { Product } from "../../../.."
import middlewares from "../../../middlewares"

const route = Router()

export default (app) => {
  app.use("/products", route)

  route.get("/", middlewares.wrap(require("./list-products").default))
  route.post("/search", middlewares.wrap(require("./search").default))
  route.get("/:id", middlewares.wrap(require("./get-product").default))

  return app
}

export const defaultStoreProductsRelations = [
  "variants",
  "variants.prices",
  "variants.options",
  "options",
  "options.values",
  "images",
  "tags",
  "collection",
  "type",
]

export * from "./list-products"
export * from "./search"

export type StoreProductsResponse = {
  product: Product
}
