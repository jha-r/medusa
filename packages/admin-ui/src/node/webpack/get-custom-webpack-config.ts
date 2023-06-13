import fse from "fs-extra"
import path from "node:path"
import webpack from "webpack"
import { CustomWebpackConfigArgs } from "../types"
import { logger } from "../utils"
import { getWebpackConfig } from "./get-webpack-config"
import { withCustomWebpackConfig } from "./with-custom-webpack-config"

export async function getCustomWebpackConfig(
  appDir: string,
  args: CustomWebpackConfigArgs
) {
  let config = getWebpackConfig(args)

  const adminConfigPath = path.join(appDir, "src", "admin", "webpack.config.js")

  const pathExists = await fse.pathExists(adminConfigPath)

  if (pathExists) {
    let webpackAdminConfig: ReturnType<typeof withCustomWebpackConfig>

    try {
      webpackAdminConfig = require(adminConfigPath)
    } catch (e) {
      logger.panic(`Error loading custom webpack config: ${e.message}`)
    }

    if (typeof webpackAdminConfig === "function") {
      if (args.devServer) {
        config.devServer = args.devServer
      }

      config = webpackAdminConfig(config, webpack)

      console.log(JSON.stringify(config, null, 2))

      if (!config) {
        logger.panic(
          "Nothing was returned from your custom webpack configuration"
        )
      }
    }
  }

  return config
}
