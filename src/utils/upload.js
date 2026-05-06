const STABLE_UPLOAD_FILE_FLAG = "__sukiStableUploadFile"

function isString(value) {
  return typeof value === "string" && value.length > 0
}

function isBlobLike(value) {
  return typeof Blob !== "undefined" && value instanceof Blob
}

function markStableUploadFile(file) {
  if (!file) return file

  Object.defineProperty(file, STABLE_UPLOAD_FILE_FLAG, {
    value: true,
    enumerable: false,
    configurable: false,
  })

  return file
}

export function isStableUploadFile(file) {
  return Boolean(file?.[STABLE_UPLOAD_FILE_FLAG])
}

function getUploadName(source, fallbackName = "upload") {
  if (typeof File !== "undefined" && source instanceof File && source.name) {
    return source.name
  }

  if (isString(source?.name)) {
    return source.name
  }

  const rawUrl = source?.url ?? source?.thumbUrl ?? source?.preview ?? source?.uri ?? source?.path

  if (isString(rawUrl)) {
    try {
      const pathname = new URL(rawUrl, window.location.href).pathname
      const name = pathname.split("/").pop()

      if (name) {
        return name
      }
    } catch {
      const name = String(rawUrl).split("/").pop()

      if (name) {
        return name
      }
    }
  }

  return fallbackName
}

function getUploadType(source, fallbackType = "application/octet-stream") {
  if (isString(source?.type)) return source.type
  if (isString(source?.mimeType)) return source.mimeType
  return fallbackType
}

function getUploadLastModified(source) {
  if (Number.isFinite(source?.lastModified)) {
    return source.lastModified
  }

  return Date.now()
}

function createStableUploadValue(buffer, name, type, lastModified) {
  if (typeof File !== "undefined") {
    return new File([buffer], name, {
      type,
      lastModified,
    })
  }

  const blob = new Blob([buffer], { type })

  Object.defineProperty(blob, "name", {
    value: name,
    enumerable: false,
    configurable: false,
  })

  Object.defineProperty(blob, "lastModified", {
    value: lastModified,
    enumerable: false,
    configurable: false,
  })

  return blob
}

async function readBlobFromUrl(url) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Failed to read local upload source: ${response.status}`)
  }

  return response.blob()
}

function getUrlCandidates(source) {
  const candidates = [
    source?.url,
    source?.thumbUrl,
    source?.preview,
    source?.uri,
    source?.path,
    typeof source === "string" ? source : null,
  ]

  return [...new Set(candidates.filter((value) => {
    if (!isString(value)) return false

    return (
      value.startsWith("blob:")
      || value.startsWith("data:")
      || value.startsWith("content:")
      || value.startsWith("file:")
      || value.startsWith("cdvfile:")
    )
  }))]
}

export async function cloneFileForUpload(source, options = {}) {
  if (!source) {
    return null
  }

  const fallbackName = options.fallbackName ?? getUploadName(source)
  const fallbackType = options.fallbackType ?? getUploadType(source)
  const lastModified = options.lastModified ?? getUploadLastModified(source)

  if (isBlobLike(source)) {
    if (isStableUploadFile(source)) {
      return source
    }

    const buffer = await source.arrayBuffer()
    const stableFile = createStableUploadValue(
      buffer,
      getUploadName(source, fallbackName),
      source.type || fallbackType,
      lastModified,
    )

    return markStableUploadFile(stableFile)
  }

  for (const url of getUrlCandidates(source)) {
    const blob = await readBlobFromUrl(url)

    return cloneFileForUpload(blob, {
      fallbackName,
      fallbackType: blob.type || fallbackType,
      lastModified,
    })
  }

  return null
}

export async function resolveUploadFile(uploadFile, fallbackSource = null) {
  const fallbackName = uploadFile?.name ?? getUploadName(fallbackSource)
  const fallbackType = getUploadType(uploadFile, getUploadType(fallbackSource))
  const lastModified = getUploadLastModified(uploadFile ?? fallbackSource)
  const candidates = [
    uploadFile?.originFileObj,
    uploadFile?.file,
    uploadFile?.raw,
    uploadFile?.blob,
    uploadFile?.thumbUrl,
    uploadFile?.url,
    uploadFile?.preview,
    fallbackSource,
  ]

  for (const candidate of candidates) {
    const stableFile = await cloneFileForUpload(candidate, {
      fallbackName,
      fallbackType,
      lastModified,
    })

    if (stableFile) {
      return stableFile
    }
  }

  return null
}

export function debugFormData(formData, label = "FormData") {
  if (!formData?.entries || typeof console === "undefined") {
    return
  }

  const entries = []

  for (const [key, value] of formData.entries()) {
    if (typeof File !== "undefined" && value instanceof File) {
      entries.push({
        key,
        kind: "file",
        name: value.name,
        size: value.size,
        type: value.type,
      })
      continue
    }

    if (isBlobLike(value)) {
      entries.push({
        key,
        kind: "blob",
        size: value.size,
        type: value.type,
      })
      continue
    }

    entries.push({
      key,
      kind: typeof value,
      value,
    })
  }

  console.debug(`[${label}]`, entries)
}
