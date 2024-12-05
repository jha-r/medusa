"use client"

import { Checkbox } from "@/components/checkbox"
import { CheckedState } from "@radix-ui/react-checkbox"
import { CellContext, HeaderContext } from "@tanstack/react-table"
import * as React from "react"

interface DataTableSelectCellProps<TData> {
  ctx: CellContext<TData, unknown>
}

const DataTableSelectCell = <TData,>({
  ctx,
}: DataTableSelectCellProps<TData>) => {
  const checked = ctx.row.getIsSelected()
  const onChange = ctx.row.getToggleSelectedHandler()

  return (
    <Checkbox
      onClick={(e) => e.stopPropagation()}
      checked={checked}
      onCheckedChange={onChange}
    />
  )
}

interface DataTableSelectHeaderProps<TData> {
  ctx: HeaderContext<TData, unknown>
}

const DataTableSelectHeader = <TData,>({
  ctx,
}: DataTableSelectHeaderProps<TData>) => {
  const checked = ctx.table.getIsSomePageRowsSelected()
    ? "indeterminate"
    : ctx.table.getIsAllPageRowsSelected()

  const onChange = (checked: CheckedState) => {
    ctx.table.toggleAllPageRowsSelected(!!checked)
  }

  return (
    <Checkbox
      onClick={(e) => e.stopPropagation()}
      checked={checked}
      onCheckedChange={onChange}
    />
  )
}

export { DataTableSelectCell, DataTableSelectHeader }
export type { DataTableSelectCellProps, DataTableSelectHeaderProps }
