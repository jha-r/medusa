import {
  type CustomFieldImportType,
  RESOLVED_CUSTOM_FIELD_DISPLAY_MODULES,
  RESOLVED_CUSTOM_FIELD_FORM_CONFIG_MODULES,
  RESOLVED_CUSTOM_FIELD_FORM_FIELD_MODULES,
  RESOLVED_CUSTOM_FIELD_LINK_MODULES,
  RESOLVED_ROUTE_MODULES,
  RESOLVED_WIDGET_MODULES,
  VIRTUAL_MODULES,
  getWidgetZone,
  resolveVirtualId,
} from "@medusajs/admin-shared"
import path from "path"
import type * as Vite from "vite"
import {
  generateCustomFieldDisplayEntrypoint,
  generateCustomFieldFormConfigEntrypoint,
  getCustomFieldGraphPath,
  validateCustomFieldDisplay,
  validateCustomFieldFormConfig,
} from "./custom-fields"
import {
  generateCustomFieldFormFieldEntrypoint,
  validateCustomFieldFormField,
} from "./custom-fields/fields"
import {
  generateCustomFieldLinkEntrypoint,
  validateCustomFieldLink,
} from "./custom-fields/links"
import { generateRouteEntrypoint, validateRoute } from "./routes"
import { ExtensionGraph, LoadModuleOptions, MedusaVitePlugin } from "./types"
import {
  getCustomFieldConfigParams,
  getCustomFieldDisplayParams,
  getCustomFieldFieldParams,
  getCustomFieldLinkParams,
} from "./utils"
import { isVirtualModule } from "./virtual/utils"
import { generateWidgetEntrypoint, validateWidget } from "./widgets"

// const EVENT_ADD = "add"
// const EVENT_CHANGE = "change"

function isCustomFieldModule(type: any): type is CustomFieldImportType {
  return ["link", "config", "field", "display"].includes(type)
}

function getExtensionGraphPath(
  path: string,
  type: "link" | "config" | "field" | "display" | "widget" | "route"
) {
  if (isCustomFieldModule(type)) {
    return getCustomFieldGraphPath(path, type)
  }

  return path
}

export const medusaVitePlugin: MedusaVitePlugin = (options) => {
  const _extensionGraph: ExtensionGraph = new Map<string, Set<string>>()
  const _sources = new Set<string>(options?.sources ?? [])

  // let server: Vite.ViteDevServer | undefined
  let watcher: Vite.FSWatcher | undefined

  async function generateEntrypoint(options: LoadModuleOptions) {
    switch (options.type) {
      case "widget":
        return await generateWidgetEntrypoint(_sources, options.get)
      case "route":
        return await generateRouteEntrypoint(_sources, options.get)
      case "config":
        return await generateCustomFieldFormConfigEntrypoint(
          _sources,
          options.get
        )
      case "field":
        return await generateCustomFieldFormFieldEntrypoint(
          _sources,
          options.get
        )
      case "display":
        return await generateCustomFieldDisplayEntrypoint(_sources, options.get)
      case "link":
        return await generateCustomFieldLinkEntrypoint(_sources, options.get)
      default:
        return null
    }
  }

  async function loadVirtualModule(id: string, options: LoadModuleOptions) {
    const result = await generateEntrypoint(options)
    if (!result) {
      return
    }

    const { module, paths } = result

    for (const path of paths) {
      const extensionGraphPath = getExtensionGraphPath(path, options.type)
      const ids = _extensionGraph.get(extensionGraphPath) || new Set<string>()
      ids.add(id)
      _extensionGraph.set(extensionGraphPath, ids)
    }
    return module
  }

  // async function hotReloadModule(moduleId: string) {
  //   const module = server?.moduleGraph.getModuleById(moduleId)

  //   if (module) {
  //     server?.hot.send({
  //       type: "update",
  //       updates: [
  //         {
  //           type: "js-update",
  //           acceptedPath: moduleId,
  //           path: moduleId,
  //           timestamp: Date.now(),
  //         },
  //       ],
  //     })
  //   }
  // }

  // async function hotReloadModules(moduleIds: Set<string>) {
  //   for (const moduleId of moduleIds) {
  //     await hotReloadModule(moduleId)
  //   }
  // }

  // const reloadModule = hotReloadModule
  // const reloadModules = hotReloadModules

  // function getWidgetZoneImports(zoneValues: InjectionZone[]): Set<string> {
  //   return new Set(
  //     zoneValues.map((zone) =>
  //       resolveVirtualId(getVirtualId(getWidgetImport(zone)))
  //     )
  //   )
  // }

  // function getCustomFieldImports(paths: string[]): Set<string> {
  //   const set = new Set(
  //     paths.map((path) =>
  //       resolveVirtualId(getVirtualId(getCustomFieldImport(path)))
  //     )
  //   )

  //   return set
  // }

  // async function handleInvalidFile(file: string) {
  //   const extensionIds = _extensionGraph.get(file)
  //   _extensionGraph.delete(file)
  //   if (extensionIds) {
  //     await hotReloadModules(extensionIds)
  //   }
  // }

  // async function updateExtensionGraphAndReloadModules(
  //   graphPath: string,
  //   imports: Set<string>
  // ) {
  //   _extensionGraph.set(graphPath, imports)
  // }

  // async function genericHandler<TResult extends { valid: boolean }>(
  //   file: string,
  //   event: typeof EVENT_ADD | typeof EVENT_CHANGE,
  //   validator: (file: string) => Promise<TResult>,
  //   getImports: (result: TResult) => Set<string>,
  //   getGraphPath: (file: string) => string
  // ) {
  //   const result = await validator(file)
  //   const graphPath = getGraphPath(file)

  //   if (!result.valid) {
  //     return event === EVENT_CHANGE
  //       ? await handleInvalidFile(graphPath)
  //       : undefined
  //   }

  //   const imports = getImports(result)

  //   if (event === EVENT_ADD || !_extensionGraph.has(graphPath)) {
  //     await updateExtensionGraphAndReloadModules(graphPath, imports)
  //     return
  //   }

  //   const existingModules = _extensionGraph.get(graphPath) || new Set<string>()
  //   const updatedImports = new Set<string>(existingModules)

  //   for (const moduleId of existingModules) {
  //     if (!imports.has(moduleId)) {
  //       updatedImports.delete(moduleId)
  //       await hotReloadModule(moduleId)
  //     }
  //   }

  //   for (const moduleId of imports) {
  //     if (!existingModules.has(moduleId)) {
  //       updatedImports.add(moduleId)
  //     }

  //     await hotReloadModule(moduleId)
  //   }

  //   _extensionGraph.set(graphPath, updatedImports)
  // }

  // async function handleWidgetChange(
  //   file: string,
  //   event: typeof EVENT_ADD | typeof EVENT_CHANGE
  // ) {
  //   await genericHandler(
  //     file,
  //     event,
  //     validateWidget,
  //     (result) =>
  //       getWidgetZoneImports(
  //         Array.isArray(result.zone!) ? result.zone! : [result.zone!]
  //       ),
  //     (file) => file
  //   )
  // }

  // async function handleRouteChange(
  //   file: string,
  //   event: typeof EVENT_ADD | typeof EVENT_CHANGE
  // ) {
  //   await genericHandler(
  //     file,
  //     event,
  //     validateRoute,
  //     () => new Set(RESOLVED_ROUTE_MODULES),
  //     (file) => file
  //   )
  // }

  // async function handleCustomFieldChange(
  //   path: string,
  //   event: typeof EVENT_ADD | typeof EVENT_CHANGE
  // ) {
  //   const customFieldTypes = [
  //     { type: "config", validator: validateCustomFieldFormConfig },
  //     { type: "field", validator: validateCustomFieldFormField },
  //     { type: "display", validator: validateCustomFieldDisplay },
  //     { type: "link", validator: validateCustomFieldLink },
  //   ] as const

  //   const handleCustomFieldType = async (
  //     type: (typeof customFieldTypes)[number]["type"],
  //     validator: (typeof customFieldTypes)[number]["validator"]
  //   ) => {
  //     const graphPath = getCustomFieldGraphPath(path, type)
  //     await genericHandler(
  //       path,
  //       event,
  //       validator,
  //       (result) => getCustomFieldImports(result.paths!),
  //       () => graphPath
  //     )
  //   }

  //   await Promise.all(
  //     customFieldTypes.map(async ({ type, validator }) =>
  //       handleCustomFieldType(type, validator)
  //     )
  //   )
  // }

  // const handlers = {
  //   widget: handleWidgetChange,
  //   route: handleRouteChange,
  //   "custom-field": handleCustomFieldChange,
  // }

  // async function handleAddOrChange(
  //   path: string,
  //   event: typeof EVENT_ADD | typeof EVENT_CHANGE
  // ) {
  //   if (!isFileInSources(path)) {
  //     return
  //   }

  //   const type = getModuleType(path)

  //   if (type === "none") {
  //     return
  //   }

  //   const handler = handlers[type]

  //   if (handler) {
  //     await handler(path, event)
  //   }
  // }

  // async function handleUnlink(path: string) {
  //   if (!isFileInSources(path)) {
  //     return
  //   }

  //   const moduleIds = _extensionGraph.get(path)
  //   _extensionGraph.delete(path)
  //   if (moduleIds) {
  //     await hotReloadModules(moduleIds)
  //   }
  // }

  function isFileInSources(file: string): boolean {
    for (const source of _sources) {
      if (file.startsWith(path.resolve(source))) {
        return true
      }
    }
    return false
  }

  return {
    name: "@medusajs/admin-vite-plugin",
    enforce: "pre",
    configureServer(_server) {
      // server = _server
      watcher = _server.watcher

      watcher?.add(Array.from(_sources))

      console.log(
        "[@medusajs/admin-vite-plugin]: Running in middleware mode:",
        _server.config.server.middlewareMode
      )

      // watcher.on("all", async (event, path) => {
      //   switch (event) {
      //     case "add":
      //     case "change":
      //       await handleAddOrChange(path, event)
      //       break
      //     case "unlinkDir":
      //     case "unlink":
      //       await handleUnlink(path)
      //       break
      //   }
      // })
    },
    resolveId(id) {
      if (VIRTUAL_MODULES.includes(id)) {
        return resolveVirtualId(id)
      }
      return null
    },
    async load(id) {
      if (RESOLVED_WIDGET_MODULES.includes(id)) {
        return loadVirtualModule(id, { type: "widget", get: getWidgetZone(id) })
      }
      if (RESOLVED_ROUTE_MODULES.includes(id)) {
        return loadVirtualModule(id, {
          type: "route",
          get: id.includes("link") ? "link" : "page",
        })
      }
      if (RESOLVED_CUSTOM_FIELD_FORM_CONFIG_MODULES.includes(id)) {
        const params = getCustomFieldConfigParams(id)

        if (!params) {
          return
        }

        return loadVirtualModule(id, {
          type: "config",
          get: params,
        })
      }
      if (RESOLVED_CUSTOM_FIELD_FORM_FIELD_MODULES.includes(id)) {
        const params = getCustomFieldFieldParams(id)

        if (!params) {
          return
        }

        return loadVirtualModule(id, {
          type: "field",
          get: params,
        })
      }
      if (RESOLVED_CUSTOM_FIELD_DISPLAY_MODULES.includes(id)) {
        const params = getCustomFieldDisplayParams(id)

        if (!params) {
          return
        }

        return loadVirtualModule(id, {
          type: "display",
          get: params,
        })
      }
      if (RESOLVED_CUSTOM_FIELD_LINK_MODULES.includes(id)) {
        const params = getCustomFieldLinkParams(id)

        if (!params) {
          return
        }

        return loadVirtualModule(id, {
          type: "link",
          get: params,
        })
      }
    },
    async closeBundle() {
      if (watcher) {
        await watcher.close()
      }
    },
    async handleHotUpdate(ctx) {
      if (!isFileInSources(ctx.file)) {
        return
      }

      const modulesToReload: Vite.ModuleNode[] = []

      for (const module of ctx.modules) {
        const importers = module.importers

        for (const importer of importers) {
          if (!isVirtualModule(importer.url)) {
            continue
          }

          const type = getVirtualModuleType(importer.url)

          if (!type) {
            continue
          }

          let valid = false
          let shouldReload = false

          switch (type) {
            case "widgets": {
              const result = await validateWidget(ctx.file)
              valid = result.valid
              break
            }
            case "routes": {
              const routeType = getRouteType(importer.url)

              if (!routeType) {
                continue
              }

              const result = await validateRoute(ctx.file, routeType === "link")
              valid = result.valid
              shouldReload = routeType === "link"
              break
            }
            case "custom-fields": {
              const customFieldType = getCustomFieldType(importer.url)

              if (!customFieldType) {
                continue
              }

              shouldReload = true
              switch (customFieldType) {
                case "config": {
                  const result = await validateCustomFieldFormConfig(ctx.file)

                  valid = result.valid
                  break
                }
                case "field": {
                  const result = await validateCustomFieldFormField(ctx.file)

                  valid = result.valid
                  break
                }
                case "display": {
                  const result = await validateCustomFieldDisplay(ctx.file)

                  valid = result.valid
                  break
                }
                case "link": {
                  const result = await validateCustomFieldLink(ctx.file)

                  valid = result.valid
                  break
                }
              }
            }
          }

          const mod = await ctx.server.moduleGraph.getModuleByUrl(importer.url)

          if (!mod) {
            continue
          }

          // Check if the ctx.file is imported by the module

          if (!valid || shouldReload) {
            await ctx.server.reloadModule(mod)
            continue
          }

          modulesToReload.push(mod)
        }
      }

      return ctx.modules.concat(modulesToReload)
    },
  }
}

function getCustomFieldType(
  file: string
): "config" | "field" | "display" | "link" | null {
  const customFieldType = file.split("/").pop()

  if (customFieldType === "$config") {
    return "config"
  }

  if (customFieldType === "$field") {
    return "field"
  }

  if (customFieldType === "$display") {
    return "display"
  }

  if (customFieldType === "$link") {
    return "link"
  }

  return null
}

function getRouteType(file: string): "link" | "page" | null {
  const routeType = file.split("/").pop()

  if (routeType === "link") {
    return "link"
  }

  if (routeType === "page") {
    return "page"
  }

  return null
}

export type VirtualModuleType = "widgets" | "routes" | "custom-fields"

function getVirtualModuleType(url: string): VirtualModuleType | null {
  const urlParts = url.split("/")
  if (urlParts.length <= 1) {
    return null
  }

  const type = urlParts[1]

  if (isVirtualModuleType(type)) {
    return type
  }

  return null
}

function isVirtualModuleType(type: string): type is VirtualModuleType {
  return ["widgets", "routes", "custom-fields"].includes(type)
}
