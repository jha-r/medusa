import { useParams } from "react-router-dom"
import { RouteFocusModal } from "../../../components/modals"
import { ProductInventoryForm } from "./components/product-inventory-form"
import { useProductInventoryData } from "./hooks/use-product-inventory-data"

export const ProductInventory = () => {
  const { id } = useParams<{ id: string }>()

  const { variants, locations, isLoaded } = useProductInventoryData(id!)

  return (
    <RouteFocusModal>
      {isLoaded && (
        <ProductInventoryForm variants={variants} locations={locations} />
      )}
    </RouteFocusModal>
  )
}
