import clsx from "clsx"
import React from "react"

type LabelProps = {
  className?: string
} & React.HTMLAttributes<HTMLSpanElement>

const Label = ({ children, className }: LabelProps) => {
  return (
    <span
      className={clsx(
        "text-medusa-fg-base dark:text-medusa-fg-base-dark text-compact-medium-plus",
        className
      )}
    >
      {children}
    </span>
  )
}

export default Label
