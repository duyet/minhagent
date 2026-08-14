import { existsSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")

function firstExisting(candidates) {
  return candidates.find((path) => existsSync(path))
}

function resolvePath(base) {
  return firstExisting([
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    join(base, "index.ts"),
    join(base, "index.tsx"),
    join(base, "index.js"),
  ])
}

function isProjectParent(parentURL) {
  if (!parentURL?.startsWith("file:")) return false
  const path = fileURLToPath(parentURL)
  return path.startsWith(root) && !path.includes("/node_modules/")
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const found = resolvePath(join(root, specifier.slice(2)))
    if (found) {
      return nextResolve(pathToFileURL(found).href, context)
    }
  }

  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    isProjectParent(context.parentURL)
  ) {
    const parentDir = dirname(fileURLToPath(context.parentURL))
    const found = resolvePath(join(parentDir, specifier))
    if (found) {
      return nextResolve(pathToFileURL(found).href, context)
    }
  }

  return nextResolve(specifier, context)
}
