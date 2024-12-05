"use client"

import { Input } from "@/components/input"
import * as React from "react"
import { Skeleton } from "../../../components/skeleton"
import { clx } from "../../../utils/clx"
import { useDataTableContext } from "../context/use-data-table-context"

interface DataTableSearchProps {
  autoFocus?: boolean
  className?: string
  placeholder?: string
}

const DataTableSearch = ({ className, ...props }: DataTableSearchProps) => {
  const { instance } = useDataTableContext()

  if (!instance.enableSearch) {
    throw new Error(
      "DataTable.Search was rendered but search is not enabled. Make sure to pass search to 'useDataTable'"
    )
  }

  if (instance.showSkeleton) {
    return <DataTableSearchSkeleton />
  }

  return (
    <Input
      size="small"
      type="search"
      value={instance.getSearch()}
      onChange={(e) => instance.onSearchChange(e.target.value)}
      className={clx(
        {
          "pr-[calc(15px+2px+8px)]": instance.isLoading,
        },
        className
      )}
      {...props}
    />
  )
}

const DataTableSearchSkeleton = () => {
  return <Skeleton className="h-7 w-[128px]" />
}

export { DataTableSearch }
export type { DataTableSearchProps }
