import { describe, expect, it } from 'vitest'
import {
  decodeShareToken,
  encodeSharePayload,
  extractTokenFromInput,
} from '../src/features/share/shareToken'

describe('shareToken', () => {
  it('supports encode/decode roundtrip', () => {
    const payload = {
      version: 1,
      selectedIds: ['google-chrome', 'visual-studio-code'],
      options: {
        silentInstall: true,
        continueOnError: false,
        includeMsStoreApps: false,
      },
    }

    const token = encodeSharePayload(payload)
    const decoded = decodeShareToken(token)

    expect(decoded).toEqual(payload)
  })

  it('extracts token from full share URL', () => {
    const payload = {
      version: 1,
      selectedIds: ['firefox'],
      options: {
        silentInstall: true,
        continueOnError: true,
        includeMsStoreApps: false,
      },
    }

    const token = encodeSharePayload(payload)
    const shareUrl = `https://example.github.io/appanvil/#/share/${encodeURIComponent(token)}`

    expect(extractTokenFromInput(shareUrl)).toBe(token)
  })

  it('rejects invalid tokens', () => {
    expect(() => decodeShareToken('not-a-valid-token')).toThrow()
  })
})
