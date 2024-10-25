import Ajv from "ajv"
import fs from "fs"
import path from "path"
import { describe, expect, test } from "vitest"

import schema from "../$schema.json"

const ajv = new Ajv()

const validate = ajv.compile(schema)
const translationsDir = path.join(__dirname, "..")

describe("validate translations", () => {
  const files = fs
    .readdirSync(translationsDir)
    .filter((file) => file.endsWith(".json") && file !== "$schema.json")

  test.each(files)("should validate %s", (file) => {
    const filePath = path.join(translationsDir, file)
    const translations = JSON.parse(fs.readFileSync(filePath, "utf-8"))
    expect(validate(translations)).toBe(true)
  })
})
