import { Dirent } from "fs"
import { readdir } from "fs/promises"
import { join } from "path"

export async function readFilesRecursive(dir: string): Promise<Dirent[]> {
  let allEntries: Dirent[] = []
  const readRecursive = async (dir) => {
    const entries = await readdir(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        await readRecursive(fullPath)
      } else {
        entry.path = dir
        allEntries.push(entry)
      }
    }
  }

  await readRecursive(dir)
  return allEntries
}
