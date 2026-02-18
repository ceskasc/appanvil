import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string'
import { z } from 'zod'

export const generatorOptionsSchema = z.object({
  silentInstall: z.boolean(),
  continueOnError: z.boolean(),
  includeMsStoreApps: z.boolean(),
})

export const sharePayloadSchema = z.object({
  version: z.number().int().positive(),
  selectedIds: z.array(z.string().min(1)).min(1),
  options: generatorOptionsSchema,
})

export type SharePayload = z.infer<typeof sharePayloadSchema>

const normalizePayload = (payload: SharePayload): SharePayload => ({
  version: payload.version,
  selectedIds: [...new Set(payload.selectedIds)],
  options: {
    silentInstall: payload.options.silentInstall,
    continueOnError: payload.options.continueOnError,
    includeMsStoreApps: payload.options.includeMsStoreApps,
  },
})

const parsePayload = (value: unknown): SharePayload => {
  const parsed = sharePayloadSchema.safeParse(value)
  if (!parsed.success) {
    throw new Error('Share payload is invalid.')
  }
  return normalizePayload(parsed.data)
}

export const parseSelectionJsonPayload = (jsonText: string): SharePayload => {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error('Selection JSON is not valid JSON.')
  }
  return parsePayload(parsed)
}

export const encodeSharePayload = (payload: SharePayload): string => {
  const normalized = parsePayload(payload)
  const encoded = compressToEncodedURIComponent(JSON.stringify(normalized))
  if (!encoded) {
    throw new Error('Failed to encode share payload.')
  }
  return encoded
}

export const decodeShareToken = (token: string): SharePayload => {
  const trimmed = token.trim()
  if (!trimmed) {
    throw new Error('Share token is empty.')
  }

  const decoded = decompressFromEncodedURIComponent(trimmed)
  if (!decoded) {
    throw new Error('Share token could not be decoded.')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(decoded)
  } catch {
    throw new Error('Share token did not decode to JSON.')
  }

  return parsePayload(parsed)
}

export const extractTokenFromInput = (value: string): string => {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error('Input is empty.')
  }

  const marker = '#/share/'
  const markerIndex = trimmed.indexOf(marker)
  if (markerIndex >= 0) {
    const tokenPart = trimmed.slice(markerIndex + marker.length).trim()
    if (!tokenPart) {
      throw new Error('Share URL does not contain a token.')
    }
    return decodeURIComponent(tokenPart)
  }

  if (trimmed.startsWith('/share/')) {
    return decodeURIComponent(trimmed.slice('/share/'.length))
  }

  return decodeURIComponent(trimmed)
}
