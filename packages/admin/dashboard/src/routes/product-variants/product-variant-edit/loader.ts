import { LoaderFunctionArgs } from "react-router-dom"

import { productVariantQueryKeys } from "../../../hooks/api"
import { sdk } from "../../../lib/client"
import { queryClient } from "../../../lib/query-client"

const queryFn = async (id: string, variantId: string) => {
  return await sdk.admin.product.retrieveVariant(id, variantId)
}

const editProductVariantQuery = (id: string, variantId: string) => ({
  queryKey: productVariantQueryKeys.detail(variantId),
  queryFn: async () => queryFn(id, variantId),
})

export const editProductVariantLoader = async ({
  params,
}: LoaderFunctionArgs) => {
  const id = params.id
  const variantId = params.variant_id
  const query = editProductVariantQuery(id!, variantId!)

  return (
    queryClient.getQueryData<ReturnType<typeof queryFn>>(query.queryKey) ??
    (await queryClient.fetchQuery(query))
  )
}
