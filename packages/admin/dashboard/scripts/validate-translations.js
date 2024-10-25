const Ajv = require("ajv")
const fs = require("fs")
const path = require("path")
const schema = require("../src/i18n/translations/$schema.json")

const translationsDir = path.join(__dirname, "../src/i18n/translations")

const ajv = new Ajv()
const validate = ajv.compile(schema)

const files = fs
  .readdirSync(translationsDir)
  .filter((file) => file.endsWith(".json") && file !== "$schema.json")

let hasErrors = false

files.forEach((file) => {
  const filePath = path.join(translationsDir, file)
  const translations = JSON.parse(fs.readFileSync(filePath, "utf-8"))

  if (!validate(translations)) {
    console.error(`Validation failed for ${file}:`)
    console.error(validate.errors)
    hasErrors = true
  } else {
    console.log(`${file} is valid.`)
  }
})

if (hasErrors) {
  console.error("Validation failed for one or more files.")
  process.exit(1)
} else {
  console.log("All translation files are valid.")
  process.exit(0)
}
