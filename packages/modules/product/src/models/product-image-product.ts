import { generateEntityId } from "@medusajs/framework/utils"
import { BeforeCreate, Entity, ManyToOne, OnInit, OptionalProps, PrimaryKey, Property, Rel } from "@mikro-orm/core"
import Product from "./product"
import ProductImage from "./product-image"

type OptionalProductProps = "product" | "image"

@Entity({ tableName: "product_images" })
class ProductImageProduct {
  [OptionalProps]: OptionalProductProps

  @PrimaryKey({ columnType: "text" })
  id!: string

  @Property({ columnType: "text" })
  product_id: string

  @ManyToOne({
    fieldName: "product_id",
    entity: () => Product,
  })
  product: Rel<Product>

  @Property({ columnType: "text" })
  image_id: string

  @ManyToOne({
    fieldName: "image_id",
    entity: () => ProductImage,
  })
  image: Rel<ProductImage>

  @Property({ columnType: "integer", default: 0 })
  rank: number | null

  @BeforeCreate()
  onCreate() {
    this.id = generateEntityId(this.id, "pip")
  }

  @OnInit()
  onInit() {
    this.id = generateEntityId(this.id, "pip")
  }
}

export default ProductImageProduct