import {
  ContainerRegistrationKeys,
  ModulesSdkUtils,
  promiseAll,
} from "@medusajs/utils"
import {
  ExternalModuleDeclaration,
  InternalModuleDeclaration,
  ModuleJoinerConfig,
} from "@medusajs/types"

export interface InitModulesOptions {
  injectedDependencies?: Record<string, unknown>
  databaseConfig: {
    clientUrl: string
    schema?: string
  }
  modulesConfig: {
    [key: string]:
      | string
      | boolean
      | Partial<InternalModuleDeclaration | ExternalModuleDeclaration>
  }
  joinerConfig?: ModuleJoinerConfig[]
  preventConnectionDestroyWarning?: boolean
}

export async function initModules({
  injectedDependencies,
  databaseConfig,
  modulesConfig,
  joinerConfig,
  preventConnectionDestroyWarning = false,
}: InitModulesOptions) {
  const { MedusaApp, MedusaModule } = await import("@medusajs/modules-sdk")
  injectedDependencies ??= {}

  let sharedPgConnection =
    injectedDependencies?.[ContainerRegistrationKeys.PG_CONNECTION]

  let shouldDestroyConnectionAutomatically = !sharedPgConnection
  if (!sharedPgConnection) {
    sharedPgConnection = ModulesSdkUtils.createPgConnection({
      clientUrl: databaseConfig.clientUrl,
      schema: databaseConfig.schema,
    })

    injectedDependencies[ContainerRegistrationKeys.PG_CONNECTION] =
      sharedPgConnection
  }

  const medusaApp = await MedusaApp({
    modulesConfig,
    servicesConfig: joinerConfig,
    injectedDependencies,
  })

  async function shutdown() {
    if (shouldDestroyConnectionAutomatically) {
      await promiseAll([
        (sharedPgConnection as any).context?.destroy(),
        (sharedPgConnection as any).destroy(),
        medusaApp.onApplicationShutdown(),
      ])
    } else {
      if (!preventConnectionDestroyWarning) {
        console.info(
          `You are using a custom shared connection. The connection won't be destroyed automatically.`
        )
      }
    }
    MedusaModule.clearInstances()
  }

  return {
    medusaApp,
    shutdown,
  }
}
