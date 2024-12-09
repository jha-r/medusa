import { Dirent } from "fs"
import { readdir } from "fs/promises"
import { join } from "path"

export async function readDirRecursive(dir: string): Promise<Dirent[]> {
  let allEntries: Dirent[] = []
  const readRecursive = async (dir) => {
    const entries = await readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      Object.defineProperty(entry, "path", {
        value: dir,
      })
      allEntries.push(entry)

      if (entry.isDirectory()) {
        await readRecursive(fullPath)
      }
    }
  }

  await readRecursive(dir)
  return allEntries
}
