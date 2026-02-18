import { describe, expect, it } from 'vitest'
import type { CatalogApp, AppProviders } from '../src/data/schema'
import {
  DEFAULT_GENERATOR_OPTIONS,
  generateInstallOutputs,
} from '../src/features/generator/generator'
import { sharePayloadSchema } from '../src/features/share/shareToken'

const createApp = (
  id: string,
  name: string,
  providers: AppProviders,
): CatalogApp => ({
  id,
  name,
  description: `${name} description`,
  category: 'Utilities',
  tags: ['test'],
  popularity: 50,
  addedAt: '2026-01-01',
  icon: 'app-window',
  providers,
  homepage: 'https://example.com',
  license: 'freeware',
  needsVerification: false,
})

describe('generator', () => {
  it('includes expected winget flags', () => {
    const app = createApp('vscode', 'VS Code', {
      winget: {
        packageId: 'Microsoft.VisualStudioCode',
        source: 'winget',
        supportsSilent: true,
        notes: '',
      },
    })

    const output = generateInstallOutputs([app], DEFAULT_GENERATOR_OPTIONS)

    expect(output.winget).toContain(
      'winget install --id Microsoft.VisualStudioCode --exact --accept-source-agreements --accept-package-agreements --silent',
    )
  })

  it('adds silent flag only when app supports silent mode', () => {
    const silentApp = createApp('silent-app', 'Silent App', {
      winget: {
        packageId: 'Vendor.SilentApp',
        source: 'winget',
        supportsSilent: true,
        notes: '',
      },
    })
    const nonSilentApp = createApp('loud-app', 'Loud App', {
      winget: {
        packageId: 'Vendor.LoudApp',
        source: 'winget',
        supportsSilent: false,
        notes: '',
      },
    })

    const output = generateInstallOutputs(
      [silentApp, nonSilentApp],
      DEFAULT_GENERATOR_OPTIONS,
    )
    const wingetLines = output.winget
      .split('\n')
      .filter((line) => line.startsWith('winget install'))
    const silentLine = wingetLines.find((line) => line.includes('Vendor.SilentApp'))
    const nonSilentLine = wingetLines.find((line) =>
      line.includes('Vendor.LoudApp'),
    )

    expect(silentLine).toContain('--silent')
    expect(nonSilentLine).not.toContain('--silent')
  })

  it('includes Chocolatey and Scoop outputs only for mapped apps', () => {
    const wingetOnly = createApp('winget-only', 'Winget Only', {
      winget: {
        packageId: 'Vendor.WingetOnly',
        source: 'winget',
        supportsSilent: true,
        notes: '',
      },
    })
    const chocoOnly = createApp('choco-only', 'Choco Only', {
      choco: {
        packageId: 'vendor-choco-only',
        notes: '',
      },
    })
    const scoopOnly = createApp('scoop-only', 'Scoop Only', {
      scoop: {
        packageId: 'vendor-scoop-only',
        bucket: 'main',
        notes: '',
      },
    })

    const output = generateInstallOutputs(
      [wingetOnly, chocoOnly, scoopOnly],
      DEFAULT_GENERATOR_OPTIONS,
    )

    expect(output.choco).toContain('vendor-choco-only')
    expect(output.choco).not.toContain('vendor-scoop-only')
    expect(output.choco).not.toContain('Vendor.WingetOnly')

    expect(output.scoop).toContain('vendor-scoop-only')
    expect(output.scoop).not.toContain('vendor-choco-only')
    expect(output.scoop).not.toContain('Vendor.WingetOnly')
  })

  it('emits selectionJson matching payload schema', () => {
    const app = createApp('app-one', 'App One', {
      winget: {
        packageId: 'Vendor.AppOne',
        source: 'winget',
        supportsSilent: true,
        notes: '',
      },
    })
    const output = generateInstallOutputs([app], DEFAULT_GENERATOR_OPTIONS)

    const parsedSelection = JSON.parse(output.selectionJson) as unknown
    const parsed = sharePayloadSchema.safeParse(parsedSelection)

    expect(parsed.success).toBe(true)
  })
})
