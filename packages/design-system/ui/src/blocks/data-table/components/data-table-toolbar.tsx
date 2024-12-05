import { clx } from "@/utils/clx"
import * as React from "react"

import { DataTableFilterBar } from "./data-table-filter-bar"

interface DataTableToolbarTranslations {
  /**
   * The label for the clear all filters button
   * @default "Clear all"
   */
  clearAll?: string
}

interface DataTableToolbarProps {
  className?: string
  children?: React.ReactNode
  translations?: DataTableToolbarTranslations
}

const DataTableToolbar = ({
  children,
  className,
  translations,
}: DataTableToolbarProps) => {
  return (
    <div className="flex flex-col divide-y">
      <div className={clx("flex items-center px-6 py-4", className)}>
        {children}
      </div>
      <DataTableFilterBar clearAllFiltersLabel={translations?.clearAll} />
    </div>
  )
}

export { DataTableToolbar }
export type { DataTableToolbarProps, DataTableToolbarTranslations }
