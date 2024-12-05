"use client"

import * as React from "react"

import { CommandBar } from "@/components/command-bar"
import { useDataTableContext } from "../context/use-data-table-context"

interface DataTableCommandBarProps {
  selectedLabel?: ((count: number) => string) | string
}

const DataTableCommandBar = ({ selectedLabel }: DataTableCommandBarProps) => {
  const { instance } = useDataTableContext()

  const commands = instance.getCommands()
  const rowSelection = instance.getRowSelection()

  const count = Object.keys(rowSelection || []).length

  const open = commands && commands.length > 0 && count > 0

  function getSelectedLabel(count: number) {
    if (typeof selectedLabel === "function") {
      return selectedLabel(count)
    }

    return selectedLabel
  }

  if (!commands || commands.length === 0) {
    return null
  }

  return (
    <CommandBar open={open}>
      <CommandBar.Bar>
        {selectedLabel && (
          <React.Fragment>
            <CommandBar.Value>{getSelectedLabel(count)}</CommandBar.Value>
            <CommandBar.Seperator />
          </React.Fragment>
        )}
        {commands.map((command, idx) => (
          <React.Fragment key={idx}>
            <CommandBar.Command
              key={command.label}
              action={() => command.action(rowSelection)}
              label={command.label}
              shortcut={command.shortcut}
            />
            {idx < commands.length - 1 && <CommandBar.Seperator />}
          </React.Fragment>
        ))}
      </CommandBar.Bar>
    </CommandBar>
  )
}

export { DataTableCommandBar }
export type { DataTableCommandBarProps }
