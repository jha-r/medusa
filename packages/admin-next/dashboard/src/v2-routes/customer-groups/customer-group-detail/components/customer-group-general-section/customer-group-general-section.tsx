import { PencilSquare, Trash } from "@medusajs/icons"
import { AdminCustomerGroupResponse } from "@medusajs/types"
import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { useDeleteCustomerGroup } from "../../../../../hooks/api/customer-groups"

type CustomerGroupGeneralSectionProps = {
  group: AdminCustomerGroupResponse["customer_group"]
}

export const CustomerGroupGeneralSection = ({
  group,
}: CustomerGroupGeneralSectionProps) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { mutateAsync } = useDeleteCustomerGroup(group.id)

  const handleDelete = async () => {
    await mutateAsync(undefined, {
      onSuccess: () => {
        navigate("/customer-groups", { replace: true })
      },
    })
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{group.name}</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <PencilSquare />,
                  label: t("actions.edit"),
                  to: `/customer-groups/${group.id}/edit`,
                },
              ],
            },
            {
              actions: [
                {
                  icon: <Trash />,
                  label: t("actions.delete"),
                  onClick: handleDelete,
                },
              ],
            },
          ]}
        />
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          {t("customers.domain")}
        </Text>
        <Text size="small" leading="compact">
          {group.customers?.length || "-"}
        </Text>
      </div>
    </Container>
  )
}
