import { PencilSquare } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { Badge, Container, Heading, Tooltip } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { SectionRow } from "../../../../../components/common/section"
import { useDashboardExtension } from "../../../../../extensions"

type ProductOrganizationSectionProps = {
  product: HttpTypes.AdminProduct
}

export const ProductOrganizationSection = ({
  product,
}: ProductOrganizationSectionProps) => {
  const { t } = useTranslation()
  const { getDisplays } = useDashboardExtension()

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("products.organization.header")}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  label: t("actions.edit"),
                  to: "organization",
                  icon: <PencilSquare />,
                },
              ],
            },
          ]}
        />
      </div>

      <SectionRow
        title={t("fields.tags")}
        value={
          product.tags?.length
            ? product.tags.map((tag) => (
                <Tooltip key={tag.id} content={tag.value}>
                  <Badge
                    key={tag.id}
                    className="block w-fit truncate"
                    size="2xsmall"
                    asChild
                  >
                    <Link to={`/products?tag_id=${tag.id}`}>{tag.value}</Link>
                  </Badge>
                </Tooltip>
              ))
            : undefined
        }
      />
      <SectionRow
        title={t("fields.type")}
        value={
          product.type ? (
            <Tooltip content={product.type.value}>
              <Badge size="2xsmall" className="block w-fit truncate" asChild>
                <Link to={`/products?type_id=${product.type_id}`}>
                  {product.type.value}
                </Link>
              </Badge>
            </Tooltip>
          ) : undefined
        }
      />

      <SectionRow
        title={t("fields.collection")}
        value={
          product.collection ? (
            <Tooltip content={product.collection.title}>
              <Badge size="2xsmall" className="block w-fit truncate" asChild>
                <Link to={`/collections/${product.collection.id}`}>
                  <span className="truncate">{product.collection.title}</span>
                </Link>
              </Badge>
            </Tooltip>
          ) : undefined
        }
      />

      <SectionRow
        title={t("fields.categories")}
        value={
          product.categories?.length
            ? product.categories.map((pcat) => (
                <Tooltip key={pcat.id} content={pcat.name}>
                  <Badge
                    size="2xsmall"
                    className="block w-fit truncate"
                    asChild
                  >
                    <Link to={`/categories/${pcat.id}`}>{pcat.name}</Link>
                  </Badge>
                </Tooltip>
              ))
            : undefined
        }
      />

      {getDisplays("product", "organize").map((Component, i) => {
        return <Component key={i} data={product} />
      })}
    </Container>
  )
}
