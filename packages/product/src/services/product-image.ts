import { Image } from "@models"
import { Context, DAL } from "@medusajs/types"
import { InjectEntityManager, MedusaContext } from "@medusajs/utils"
import { shouldForceTransaction } from "../utils"
import { ProductImageRepository } from "@repositories"

type InjectedDependencies = {
  productImageRepository: DAL.RepositoryService
}

export default class ProductImageService<TEntity extends Image = Image> {
  protected readonly productImageRepository_: DAL.RepositoryService

  constructor({ productImageRepository }: InjectedDependencies) {
    this.productImageRepository_ = productImageRepository
  }

  @InjectEntityManager(shouldForceTransaction, "productImageRepository_")
  async upsert(
    urls: string[],
    @MedusaContext() sharedContext: Context = {}
  ): Promise<TEntity[]> {
    return (await (this.productImageRepository_ as ProductImageRepository)
      .upsert!(urls, sharedContext)) as TEntity[]
  }
}
