import { model } from "@medusajs/framework/utils"

const ApiKey = model
  .define("ApiKey", {
    id: model.id({ prefix: "apk" }).primaryKey(),
    token: model.text(),
    salt: model.text(),
    redacted: model.text().searchable(),
    title: model.text().searchable(),
    type: model.enum(["publishable", "secret"]),
    last_used_at: model.dateTime().nullable(),
    created_by: model.text(),
    revoked_by: model.text().nullable(),
    revoked_at: model.dateTime().nullable(),
  })
  .indexes([
    {
      on: ["token"],
      unique: true,
    },
    {
      on: ["type"],
    },
  ])

// @Entity()
// export default class ApiKey {
// @PrimaryKey({ columnType: "text" })
// id: string
// @Property({ columnType: "text" })
// @TokenIndex.MikroORMIndex()
// token: string
// @Property({ columnType: "text" })
// salt: string
// @Searchable()
// @Property({ columnType: "text" })
// redacted: string
// @Searchable()
// @Property({ columnType: "text" })
// title: string
// @Property({ columnType: "text" })
// @Enum({ items: ["publishable", "secret"] })
// @TypeIndex.MikroORMIndex()
// type: "publishable" | "secret"
// @Property({
//   columnType: "timestamptz",
//   nullable: true,
// })
// last_used_at: Date | null = null
// @Property({ columnType: "text" })
// created_by: string
// @Property({
//   onCreate: () => new Date(),
//   columnType: "timestamptz",
//   defaultRaw: "now()",
// })
// created_at: Date
// @Property({
//   onCreate: () => new Date(),
//   onUpdate: () => new Date(),
//   columnType: "timestamptz",
//   defaultRaw: "now()",
// })
// updated_at?: Date
// @Property({ columnType: "text", nullable: true })
// revoked_by: string | null = null
// @Property({
//   columnType: "timestamptz",
//   nullable: true,
// })
// revoked_at: Date | null = null
// @BeforeCreate()
// onCreate() {
//   this.id = generateEntityId(this.id, "apk")
// }
// @OnInit()
// onInit() {
//   this.id = generateEntityId(this.id, "apk")
// }
// }
export default ApiKey
