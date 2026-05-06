const STABLE_UPLOAD_FILE_FLAG = "__sukiStableUploadFile"

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

export async function cloneFileForUpload(file) {
  if (!(file instanceof Blob) || isStableUploadFile(file)) {
    return file ?? null
  }

  const buffer = await file.arrayBuffer()
  const stableFile = new File(
    [buffer],
    file instanceof File && file.name ? file.name : "upload",
    {
      type: file.type || "application/octet-stream",
      lastModified: file instanceof File ? file.lastModified : Date.now(),
    },
  )

  return markStableUploadFile(stableFile)
}

export async function stabilizeUploadFile(uploadFile) {
  if (!uploadFile?.originFileObj) {
    return uploadFile
  }

  const stableFile = await cloneFileForUpload(uploadFile.originFileObj)

  if (!stableFile || stableFile === uploadFile.originFileObj) {
    return uploadFile
  }

  return {
    ...uploadFile,
    originFileObj: stableFile,
  }
}
