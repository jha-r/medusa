import express, { Request, Response, Router } from "express"
import fse from "fs-extra"
import { ServerResponse } from "http"
import { resolve } from "path"
import { PluginOptions } from "../types"

export default function (_rootDirectory: string, options: PluginOptions) {
  const app = Router()

  const { serve = true, base = "/app" } = options

  if (serve) {
    const dashboardPath = resolve(__dirname, "..", "..", "build")
    const htmlPath = resolve(dashboardPath, "index.html")
    const html = fse.readFileSync(htmlPath, "utf-8")

    const sendHtml = (_req: Request, res: Response) => {
      res.setHeader("Cache-Control", "no-cache")
      res.setHeader("Vary", "Origin, Cache-Control")
      res.send(html)
    }

    const setStaticHeaders = (res: ServerResponse) => {
      res.setHeader("Cache-Control", "max-age=31536000, immutable")
      res.setHeader("Vary", "Origin, Cache-Control")
    }

    app.get(base, sendHtml)
    app.use(
      "/",
      express.static(dashboardPath, {
        setHeaders: setStaticHeaders,
      })
    )
    app.get(`${base}/*`, sendHtml)
  } else {
    app.get(base, (_req, res) => {
      res.send("Admin not enabled")
    })
  }

  return app
}
