if (typeof process.env.DB_TEMP_NAME === "undefined") {
  const tempName = parseInt(process.env.JEST_WORKER_ID || "1")
  process.env.DB_TEMP_NAME = `medusa-locking-integration-${tempName}`
}

process.env.MEDUSA_ORDER_DB_SCHEMA = "public"
