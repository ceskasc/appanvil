import {
  Clipboard,
  Download,
  FileCode2,
  FileCog,
  FileJson2,
  PackageCheck,
  TerminalSquare,
  createElement,
} from 'lucide'
import type { IconNode } from 'lucide'
import type { CatalogApp } from '../../data/schema'
import type { GenerateTab, GeneratorOutput } from './generator'

interface RenderGenerateViewProps {
  selectedApps: CatalogApp[]
  outputs: GeneratorOutput | null
  activeTab: GenerateTab
}

interface TabMeta {
  id: GenerateTab
  label: string
  icon: IconNode
}

const TAB_ORDER: TabMeta[] = [
  { id: 'ps1', label: 'PowerShell Script', icon: FileCode2 },
  { id: 'winget', label: 'Winget Commands', icon: TerminalSquare },
  { id: 'installer', label: 'Installer .cmd', icon: FileCog },
  { id: 'choco', label: 'Chocolatey Script', icon: PackageCheck },
  { id: 'scoop', label: 'Scoop Script', icon: PackageCheck },
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

const getOutputContent = (outputs: GeneratorOutput, tab: GenerateTab): string => {
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
    return 'installer'
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

export const renderGenerateView = ({
  selectedApps,
  outputs,
  activeTab,
}: RenderGenerateViewProps): string => {
  if (selectedApps.length === 0) {
    return `
      <section class="panel max-w-4xl">
        <h1 class="text-2xl font-bold tracking-tight text-[color:var(--text-strong)]">Advanced Outputs</h1>
        <p class="mt-3 text-sm text-[color:var(--text-muted)]">
          Select apps on the home page to generate your command bundle profile.
        </p>
        <a href="#/" class="btn-primary mt-5 inline-flex">Back to Home</a>
      </section>
    `
  }

  if (!outputs) {
    return `
      <section class="panel max-w-4xl">
        <p class="text-sm text-[color:var(--text-muted)]">Preparing output...</p>
      </section>
    `
  }

  const availableTabs = getAvailableGenerateTabs(outputs)
  const currentTab = resolveGenerateTab(activeTab, outputs)
  const currentContent = getOutputContent(outputs, currentTab)

  return `
    <section class="panel min-w-0">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-[color:var(--text-strong)]">Advanced Outputs</h1>
          <p class="mt-1 text-xs text-[color:var(--text-subtle)]">Native EXE is coming. Use these outputs as your installation bundle today.</p>
        </div>
        <div class="flex items-center gap-2">
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
                    ? 'border-[color:var(--accent-strong)] bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]'
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
  `
}
