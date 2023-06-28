import glob from "glob"
import path from "path"
import { EntitySchema } from "typeorm"

import { formatRegistrationName } from "../../utils/format-registration-name"
import { ClassConstructor } from "../../types/global"

type GetModelExtensionMapParams = {
  directory?: string
  pathGlob?: string
  config: Record<string, any>
}

export function getModelExtensionsMap({
  directory,
  pathGlob,
  config = {},
}: GetModelExtensionMapParams): Map<
  string,
  ClassConstructor<unknown> | EntitySchema
> {
  const modelExtensionsMap = new Map<
    string,
    ClassConstructor<unknown> | EntitySchema
  >()
  const fullPathGlob =
    directory && pathGlob ? path.join(directory, pathGlob) : null
console.log("fullPathGlob - ", fullPathGlob)
  const modelExtensions = fullPathGlob
    ? glob.sync(fullPathGlob, {
        cwd: directory,
        ignore: ["index.js", "index.map.js"],
      })
    : []
console.log("modelExtensions - ", modelExtensions)
  modelExtensions.forEach((modelExtensionPath) => {
    const extendedModel = require(modelExtensionPath) as
      | ClassConstructor<unknown>
      | EntitySchema
      | undefined
console.log("extendedModel - ", extendedModel)
    if (extendedModel) {
      Object.entries(extendedModel).map(
        ([_key, val]: [string, ClassConstructor<unknown> | EntitySchema]) => {
          console.log("typeof val - ", typeof val)
          console.log("config.register - ", config.register)
          if (typeof val === "function" || val instanceof EntitySchema) {
            if (config.register) {
              const name = formatRegistrationName(modelExtensionPath)

              modelExtensionsMap.set(name, val)
            }
          }
        }
      )
    }
  })

  return modelExtensionsMap
}
