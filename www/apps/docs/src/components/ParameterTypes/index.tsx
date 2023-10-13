import { Badge, DetailsSummary, InlineCode, MarkdownContent } from "docs-ui"
import React from "react"
import Details from "../../theme/Details"
import clsx from "clsx"

type Parameter = {
  name: string
  type: string
  optional?: boolean
  defaultValue?: string
  description?: string
  children?: Parameter[]
}

type ParameterTypesProps = {
  parameters: Parameter[]
  level?: number
}

const ParameterTypes = ({ parameters, level = 1 }: ParameterTypesProps) => {
  const paddingStyling = {
    padding: `${8 * level}px`,
  }
  function getSummary(parameter: Parameter, nested = true) {
    return (
      <DetailsSummary
        subtitle={
          parameter.description || parameter.defaultValue ? (
            <>
              <MarkdownContent
                allowedElements={["a", "strong", "code"]}
                unwrapDisallowed={true}
              >
                {parameter.description}
              </MarkdownContent>
              {parameter.defaultValue && (
                <p className="mt-0.5 mb-0">
                  Default: <InlineCode>{parameter.defaultValue}</InlineCode>
                </p>
              )}
            </>
          ) : undefined
        }
        badge={
          <Badge variant={parameter.optional ? "neutral" : "red"}>
            {parameter.optional ? "Optional" : "Required"}
          </Badge>
        }
        expandable={parameter.children.length > 0}
        className={clsx(
          "odd:[&:not(:first-child):not(:last-child)]:!border-y last:not(:first-child):!border-t first:!border-t-0 first:not(:last-child):!border-b last:!border-b-0 even:!border-y-0",
          !nested && "cursor-default"
        )}
        style={!nested ? paddingStyling : {}}
        onClick={(e) => {
          const targetElm = e.target as HTMLElement
          if (targetElm.tagName.toLowerCase() === "a") {
            window.location.href =
              targetElm.getAttribute("href") || window.location.href
            return
          }
        }}
      >
        <InlineCode>{parameter.name}</InlineCode>
        <span className="font-monospace text-compact-x-small ml-1 text-medusa-fg-subtle">
          <MarkdownContent allowedElements={["a"]} unwrapDisallowed={true}>
            {parameter.type}
          </MarkdownContent>
        </span>
      </DetailsSummary>
    )
  }

  return (
    <div
      className={clsx(
        "border border-solid border-medusa-border-base rounded",
        level > 1 && "bg-docs-bg-surface"
      )}
    >
      {parameters.map((parameter, key) => {
        return (
          <>
            {parameter.children.length > 0 && (
              <Details
                summary={getSummary(parameter)}
                key={key}
                className={clsx(
                  "odd:[&:not(:first-child):not(:last-child)]:!border-y last:not(:first-child):!border-t first:!border-t-0 first:not(:last-child):!border-b last:!border-b-0 even:!border-y-0"
                )}
                style={paddingStyling}
              >
                {parameter.children && (
                  <ParameterTypes
                    parameters={parameter.children}
                    level={level + 1}
                  />
                )}
              </Details>
            )}
            {parameter.children.length === 0 && getSummary(parameter, false)}
          </>
        )
      })}
    </div>
  )
}

export default ParameterTypes
