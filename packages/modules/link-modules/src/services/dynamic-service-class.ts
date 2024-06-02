import { Constructor, ILinkModule, ModuleJoinerConfig } from "@medusajs/types"
import { LinkModuleService } from "@services"

export function getModuleService(
  joinerConfig: ModuleJoinerConfig
): Constructor<ILinkModule> {
  const joinerConfig_ = JSON.parse(JSON.stringify(joinerConfig))
  const databaseConfig = joinerConfig_.databaseConfig

  delete joinerConfig_.databaseConfig

  joinerConfig_.extraFields = Object.keys(databaseConfig.extraFields || {})

  return class LinkService extends LinkModuleService<unknown> {
    override __joinerConfig(): ModuleJoinerConfig {
      return joinerConfig_ as ModuleJoinerConfig
    }
  }
}

export function getReadOnlyModuleService(joinerConfig: ModuleJoinerConfig) {
  return class ReadOnlyLinkService {
    __joinerConfig(): ModuleJoinerConfig {
      return joinerConfig as ModuleJoinerConfig
    }
  }
}
