import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  Download,
  FileCode2,
  FileCog,
  FileJson2,
  PackageCheck,
  Settings2,
  TerminalSquare,
  createElement,
} from 'lucide'
import type { IconNode } from 'lucide'
import type { CatalogApp } from '../../data/schema'
import type { GenerateTab, GeneratorOptions, GeneratorOutput } from './generator'

interface RenderGenerateViewProps {
  selectedApps: CatalogApp[]
  options: GeneratorOptions
  outputs: GeneratorOutput | null
  activeTab: GenerateTab
}

interface TabMeta {
  id: GenerateTab
  label: string
  icon: IconNode
}

const TAB_ORDER: TabMeta[] = [
  { id: 'ps1', label: 'PowerShell', icon: FileCode2 },
  { id: 'winget', label: 'Winget', icon: TerminalSquare },
  { id: 'installer', label: 'Installer .cmd', icon: FileCog },
  { id: 'choco', label: 'Chocolatey', icon: PackageCheck },
  { id: 'scoop', label: 'Scoop', icon: PackageCheck },
  { id: 'json', label: 'Selection JSON', icon: FileJson2 },
]

const iconToSvg = (icon: IconNode, className: string): string => {
  const svg = createElement(icon)
  svg.setAttribute('class', className)
  svg.setAttribute('aria-hidden', 'true')
  return svg.outerHTML
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const getProviderCounts = (apps: CatalogApp[]): Record<'winget' | 'choco' | 'scoop', number> =>
  apps.reduce(
    (counts, app) => ({
      winget: counts.winget + (app.providers.winget ? 1 : 0),
      choco: counts.choco + (app.providers.choco ? 1 : 0),
      scoop: counts.scoop + (app.providers.scoop ? 1 : 0),
    }),
    { winget: 0, choco: 0, scoop: 0 },
  )

const getOutputContent = (
  outputs: GeneratorOutput,
  tab: GenerateTab,
): string => {
  if (tab === 'ps1') return outputs.ps1
  if (tab === 'winget') return outputs.winget
  if (tab === 'installer') return outputs.installerCmd
  if (tab === 'choco') return outputs.choco ?? ''
  if (tab === 'scoop') return outputs.scoop ?? ''
  return outputs.selectionJson
}

export const getAvailableGenerateTabs = (
  outputs: GeneratorOutput | null,
): GenerateTab[] => {
  if (!outputs) {
    return []
  }

  return TAB_ORDER.filter((tab) => {
    if (tab.id === 'choco') {
      return Boolean(outputs.choco)
    }
    if (tab.id === 'scoop') {
      return Boolean(outputs.scoop)
    }
    return true
  }).map((tab) => tab.id)
}

export const resolveGenerateTab = (
  activeTab: GenerateTab,
  outputs: GeneratorOutput | null,
): GenerateTab => {
  const availableTabs = getAvailableGenerateTabs(outputs)
  if (availableTabs.length === 0) {
    return 'ps1'
  }

  return availableTabs.includes(activeTab) ? activeTab : availableTabs[0]
}

export const getGenerateOutputContent = (
  outputs: GeneratorOutput,
  tab: GenerateTab,
): string => getOutputContent(outputs, tab)

export const getGenerateFilename = (tab: GenerateTab): string => {
  if (tab === 'ps1') return 'appanvil-install.ps1'
  if (tab === 'winget') return 'appanvil-winget.txt'
  if (tab === 'installer') return 'appanvil-installer.cmd'
  if (tab === 'choco') return 'appanvil-choco.ps1'
  if (tab === 'scoop') return 'appanvil-scoop.ps1'
  return 'appanvil-selection.json'
}

const renderSelectionChips = (apps: CatalogApp[]): string => {
  const visible = apps.slice(0, 8)
  const remainder = apps.length - visible.length

  return `
    <div class="mt-3 flex flex-wrap gap-2">
      ${visible
        .map(
          (app) =>
            `<span class="rounded-full border border-[color:var(--panel-border)] bg-[color:var(--panel-soft)] px-2.5 py-1 text-xs text-[color:var(--text-subtle)]">${escapeHtml(app.name)}</span>`,
        )
        .join('')}
      ${
        remainder > 0
          ? `<span class="rounded-full border border-[color:var(--panel-border)] bg-[color:var(--panel-soft)] px-2.5 py-1 text-xs text-[color:var(--text-subtle)]">+${remainder} more</span>`
          : ''
      }
    </div>
  `
}

export const renderGenerateView = ({
  selectedApps,
  options,
  outputs,
  activeTab,
}: RenderGenerateViewProps): string => {
  if (selectedApps.length === 0) {
    return `
      <section class="panel max-w-4xl">
        <div class="flex items-center gap-3">
          <span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
            ${iconToSvg(FileCode2, 'h-5 w-5')}
          </span>
          <h1 class="text-2xl font-bold tracking-tight text-[color:var(--text-strong)]">Generate Scripts</h1>
        </div>
        <p class="mt-3 text-sm text-[color:var(--text-muted)]">
          Add apps to your cart first, then come back here to generate install scripts.
        </p>
        <a href="#/" class="btn-primary mt-5 inline-flex">Back to Catalog</a>
      </section>
    `
  }

  if (!outputs) {
    return `
      <section class="panel max-w-4xl">
        <p class="text-sm text-[color:var(--text-muted)]">Preparing generator output...</p>
      </section>
    `
  }

  const providerCounts = getProviderCounts(selectedApps)
  const availableTabs = getAvailableGenerateTabs(outputs)
  const currentTab = resolveGenerateTab(activeTab, outputs)
  const currentContent = getOutputContent(outputs, currentTab)

  return `
    <section class="space-y-5">
      <div class="panel">
        <div class="flex items-center gap-3">
          <span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
            ${iconToSvg(FileCode2, 'h-5 w-5')}
          </span>
          <div>
            <h1 class="text-2xl font-bold tracking-tight text-[color:var(--text-strong)]">Generate Scripts</h1>
            <p class="mt-1 text-xs text-[color:var(--text-subtle)]">${selectedApps.length} selected app(s)</p>
          </div>
        </div>

        <div class="mt-4 rounded-2xl border border-amber-300/70 bg-amber-50/90 px-4 py-3 text-sm text-amber-900 dark:border-amber-400/40 dark:bg-amber-400/10 dark:text-amber-200">
          <p class="flex items-center gap-2 font-semibold">
            ${iconToSvg(AlertTriangle, 'h-4 w-4')}
            Review scripts before running
          </p>
          <p class="mt-1 text-xs">This website does not execute installers.</p>
        </div>
        ${renderSelectionChips(selectedApps)}
      </div>

      <div class="grid gap-5 xl:grid-cols-[310px_minmax(0,1fr)]">
        <aside class="panel h-fit">
          <h2 class="panel-title flex items-center gap-2">
            ${iconToSvg(Settings2, 'h-4 w-4')}
            Options
          </h2>

          <div class="mt-4 space-y-3">
            <label class="flex items-start gap-2 rounded-xl border border-[color:var(--panel-border)] px-3 py-2">
              <input
                type="checkbox"
                data-generator-option="silentInstall"
                ${options.silentInstall ? 'checked' : ''}
                class="mt-0.5 h-4 w-4 accent-emerald-600"
              />
              <span>
                <span class="text-sm font-medium text-[color:var(--text-strong)]">Silent install when possible</span>
                <span class="mt-0.5 block text-xs text-[color:var(--text-subtle)]">Uses <code>--silent</code> only for supported apps.</span>
              </span>
            </label>

            <label class="flex items-start gap-2 rounded-xl border border-[color:var(--panel-border)] px-3 py-2">
              <input
                type="checkbox"
                data-generator-option="continueOnError"
                ${options.continueOnError ? 'checked' : ''}
                class="mt-0.5 h-4 w-4 accent-emerald-600"
              />
              <span>
                <span class="text-sm font-medium text-[color:var(--text-strong)]">Continue on error</span>
                <span class="mt-0.5 block text-xs text-[color:var(--text-subtle)]">If disabled, script stops on first failed install.</span>
              </span>
            </label>

            <label class="flex items-start gap-2 rounded-xl border border-[color:var(--panel-border)] px-3 py-2">
              <input
                type="checkbox"
                data-generator-option="includeMsStoreApps"
                ${options.includeMsStoreApps ? 'checked' : ''}
                class="mt-0.5 h-4 w-4 accent-emerald-600"
              />
              <span>
                <span class="text-sm font-medium text-[color:var(--text-strong)]">Include MS Store apps</span>
                <span class="mt-0.5 block text-xs text-[color:var(--text-subtle)]">Disabled by default because Store mappings may need extra review.</span>
              </span>
            </label>
          </div>

          <div class="mt-4 space-y-2 rounded-xl border border-[color:var(--panel-border)] bg-[color:var(--panel-soft)] px-3 py-3 text-xs text-[color:var(--text-subtle)]">
            <p class="flex items-center justify-between"><span>Winget mapped</span><strong class="text-[color:var(--text-strong)]">${providerCounts.winget}</strong></p>
            <p class="flex items-center justify-between"><span>Chocolatey mapped</span><strong class="text-[color:var(--text-strong)]">${providerCounts.choco}</strong></p>
            <p class="flex items-center justify-between"><span>Scoop mapped</span><strong class="text-[color:var(--text-strong)]">${providerCounts.scoop}</strong></p>
          </div>
        </aside>

        <section class="panel min-w-0">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="panel-title flex items-center gap-2">
              ${iconToSvg(CheckCircle2, 'h-4 w-4')}
              Generated Output
            </h2>
            <div class="flex items-center gap-2">
              <button
                type="button"
                data-action="download-installer-cmd"
                class="btn-ghost"
                aria-label="Download installer cmd"
              >
                ${iconToSvg(FileCog, 'h-4 w-4')}
                Installer .cmd
              </button>
              <button
                type="button"
                data-action="copy-generate-output"
                data-tab="${currentTab}"
                class="btn-ghost"
                aria-label="Copy active output"
              >
                ${iconToSvg(Clipboard, 'h-4 w-4')}
                Copy
              </button>
              <button
                type="button"
                data-action="download-generate-output"
                data-tab="${currentTab}"
                class="btn-primary"
                aria-label="Download active output"
              >
                ${iconToSvg(Download, 'h-4 w-4')}
                Download
              </button>
            </div>
          </div>

          <div class="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Generated output tabs">
            ${TAB_ORDER.filter((tab) => availableTabs.includes(tab.id))
              .map(
                (tab) => `
                  <button
                    type="button"
                    role="tab"
                    data-action="set-generate-tab"
                    data-tab="${tab.id}"
                    aria-selected="${currentTab === tab.id}"
                    class="focus-ring inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                      currentTab === tab.id
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'border-[color:var(--panel-border)] bg-[color:var(--panel-surface)] text-[color:var(--text-muted)] hover:bg-[color:var(--panel-soft)]'
                    }"
                  >
                    ${iconToSvg(tab.icon, 'h-4 w-4')}
                    ${tab.label}
                  </button>
                `,
              )
              .join('')}
          </div>

          <div class="mt-4 overflow-hidden rounded-2xl border border-[color:var(--panel-border)] bg-slate-950/95 p-0.5">
            <pre class="max-h-[70vh] overflow-auto rounded-[14px] bg-slate-950 px-4 py-4 text-xs text-slate-100"><code>${escapeHtml(currentContent)}</code></pre>
          </div>
        </section>
      </div>
    </section>
  `
}
