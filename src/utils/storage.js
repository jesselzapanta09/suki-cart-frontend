import { resolveBackendUrl } from "./runtime";

export function getStorageUrl(path) {
  if (!path) return ""

  const rawPath = String(path).trim()

  if (
    /^(https?:)?\/\//i.test(rawPath) ||
    rawPath.startsWith("data:") ||
    rawPath.startsWith("blob:")
  ) {
    return rawPath
  }

  let normalizedPath = rawPath
    .replace(/\\/g, "/")
    .replace(/^\.\/+/, "")
    .replace(/^\/+/, "")

  // Some older records may store filesystem-like prefixes. Normalize them
  // back to the public web path.
  normalizedPath = normalizedPath.replace(/^(?:api\/)?public\//i, "")

  const storageIndex = normalizedPath.search(/(?:^|\/)storage\//i)
  if (storageIndex >= 0) {
    normalizedPath = normalizedPath.slice(storageIndex).replace(/^\/+/, "")
    return resolveBackendUrl(normalizedPath)
  }

  const uploadsIndex = normalizedPath.search(/(?:^|\/)uploads\//i)
  if (uploadsIndex >= 0) {
    normalizedPath = normalizedPath.slice(uploadsIndex).replace(/^\/+/, "")
    return resolveBackendUrl(normalizedPath)
  }

  return resolveBackendUrl(`storage/${normalizedPath}`)
}
