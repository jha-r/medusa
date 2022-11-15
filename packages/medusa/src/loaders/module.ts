import { asFunction, asValue } from "awilix"
import { trackInstallation } from "medusa-telemetry"
import { ConfigModule, Logger, MedusaContainer } from "../types/global"
import { ModulesHelper } from "../utils/module-helper"

type Options = {
  container: MedusaContainer
  configModule: ConfigModule
  logger: Logger
}

const ModuleHelper = new ModulesHelper()

export default async ({
  container,
  configModule,
  logger,
}: Options): Promise<void> => {
  const moduleResolutions = configModule?.moduleResolutions ?? {}

  for (const resolution of Object.values(moduleResolutions)) {
    try {
      const loadedModule = await import(resolution.resolutionPath!)

      const moduleLoaders = loadedModule.loaders
      if (moduleLoaders) {
        for (const loader of moduleLoaders) {
          await loader({ container, configModule, logger })
        }
      }

      const moduleServices = loadedModule.services

      if (moduleServices) {
        for (const service of moduleServices) {
          container.register({
            [resolution.definition.registrationName]: asFunction(
              (cradle) => new service(cradle, configModule)
            ).singleton(),
          })
        }
      }

      const installation = {
        module: resolution.definition.key,
        resolution: resolution.resolutionPath,
      }

      trackInstallation(installation, "module")
    } catch (err) {
      console.log("Couldn't resolve module: ", resolution.definition.label)
    }
  }

  ModuleHelper.setModules(moduleResolutions)

  container.register({
    modulesHelper: asValue(ModuleHelper),
  })
}
