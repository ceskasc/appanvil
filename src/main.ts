import {
  AlertTriangle,
  LayoutPanelLeft,
  LoaderCircle,
  ShoppingBag,
  SlidersHorizontal,
  createElement,
} from 'lucide'
import type { IconNode } from 'lucide'
import { loadCatalog } from './data/catalog'
import type { CatalogApp, ProviderKey } from './data/schema'
import { wireDrawerControls } from './features/cart/drawer'
import { renderCartPanel } from './features/cart/renderCart'
import {
  applyCatalogFilters,
  extractCategories,
  type SortMode,
} from './features/catalog/filters'
import {
  renderCatalogPanel,
  renderCommandPalette,
  renderFiltersPanel,
} from './features/catalog/renderCatalog'
import {
  createCatalogSearch,
  fuzzySearchCatalog,
  type CatalogSearch,
} from './features/catalog/search'
import {
  generateInstallOutputs,
  type GenerateTab,
  type GeneratorOptions,
} from './features/generator/generator'
import {
  getGenerateFilename,
  getGenerateOutputContent,
  renderGenerateView,
  resolveGenerateTab,
} from './features/generator/renderGenerate'
import { renderShareView } from './features/share/renderShare'
import {
  decodeShareToken,
  encodeSharePayload,
  extractTokenFromInput,
  parseSelectionJsonPayload,
  type SharePayload,
} from './features/share/shareToken'
import { initRouter, type AppRoute } from './router'
import { createStore } from './store/store'
import {
  applyTheme,
  renderHeader,
  wireHeader,
} from './ui/header'
import { showToast } from './ui/toast'
import './styles.css'

const app = document.querySelector<HTMLDivElement>('#app')
if (!app) {
  throw new Error('Root app container not found.')
}

interface ShareStatusState {
  tone: 'idle' | 'success' | 'error'
  message: string
}

const DEFAULT_SHARE_STATUS: ShareStatusState = {
  tone: 'idle',
  message: 'Token/URL yapistir veya JSON dosyasi yukleyerek secimi ice aktar.',
}

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

const isGenerateTab = (value: string): value is GenerateTab =>
  value === 'ps1' ||
  value === 'winget' ||
  value === 'installer' ||
  value === 'choco' ||
  value === 'scoop' ||
  value === 'json'

const isGeneratorOptionKey = (
  value: string,
): value is keyof GeneratorOptions =>
  value === 'silentInstall' ||
  value === 'continueOnError' ||
  value === 'includeMsStoreApps'

const store = createStore()
let catalogSearch: CatalogSearch | null = null
let currentRoute: AppRoute = { kind: 'home' }
let cleanupListeners: Array<() => void> = []
let shareStatus: ShareStatusState = DEFAULT_SHARE_STATUS
let lastHandledShareToken: string | null = null

applyTheme()

const resetListeners = (): void => {
  cleanupListeners.forEach((cleanup) => cleanup())
  cleanupListeners = []
}

const setShareStatus = (tone: ShareStatusState['tone'], message: string): void => {
  shareStatus = { tone, message }
}

const getSelectedApps = (
  catalog: CatalogApp[],
  selectedIds: string[],
): CatalogApp[] => {
  const selectedSet = new Set(selectedIds)
  return catalog.filter((appItem) => selectedSet.has(appItem.id))
}

const getPaletteResults = (state = store.getState()): CatalogApp[] =>
  fuzzySearchCatalog(state.catalog, catalogSearch, state.commandPaletteQuery).slice(
    0,
    10,
  )

const getSharePayloadFromState = (
  state = store.getState(),
): SharePayload | null => {
  if (state.selectedIds.length === 0) {
    return null
  }

  return {
    version: 1,
    selectedIds: state.selectedIds,
    options: state.generatorOptions,
  }
}

const getShareUrlForPayload = (payload: SharePayload): string => {
  const token = encodeSharePayload(payload)
  return `${window.location.origin}${window.location.pathname}#/share/${encodeURIComponent(token)}`
}

const getCurrentShareUrl = (state = store.getState()): string | null => {
  const payload = getSharePayloadFromState(state)
  if (!payload) {
    return null
  }

  try {
    return getShareUrlForPayload(payload)
  } catch {
    return null
  }
}

const getGeneratorViewData = (state = store.getState()) => {
  const selectedApps = getSelectedApps(state.catalog, state.selectedIds)
  const outputs =
    selectedApps.length > 0
      ? generateInstallOutputs(selectedApps, state.generatorOptions)
      : null
  const activeTab = resolveGenerateTab(state.generateActiveTab, outputs)

  return {
    selectedApps,
    outputs,
    activeTab,
  }
}

const applyImportedPayload = (
  payload: SharePayload,
  successMessage: string,
  routeToken?: string,
): void => {
  store.importSelection(payload.selectedIds, payload.options)
  if (routeToken) {
    lastHandledShareToken = routeToken
  }
  setShareStatus('success', successMessage)
  showToast(successMessage, 'success')
}

const importFromText = (rawInput: string): void => {
  const trimmed = rawInput.trim()
  if (!trimmed) {
    throw new Error('Import input is empty.')
  }

  if (trimmed.startsWith('{')) {
    const payload = parseSelectionJsonPayload(trimmed)
    applyImportedPayload(
      payload,
      `Imported ${payload.selectedIds.length} app(s) from JSON text.`,
    )
    return
  }

  const token = extractTokenFromInput(trimmed)
  const payload = decodeShareToken(token)
  applyImportedPayload(
    payload,
    `Imported ${payload.selectedIds.length} app(s) from share token.`,
    token,
  )

  const shareHash = `#/share/${encodeURIComponent(token)}`
  if (window.location.hash !== shareHash) {
    window.location.hash = shareHash
  }
}

const handleRouteShareToken = (token: string | null): void => {
  if (!token) {
    lastHandledShareToken = null
    setShareStatus('idle', DEFAULT_SHARE_STATUS.message)
    return
  }

  if (token === lastHandledShareToken) {
    return
  }

  try {
    const payload = decodeShareToken(token)
    applyImportedPayload(
      payload,
      `Loaded ${payload.selectedIds.length} app(s) from route token.`,
      token,
    )
  } catch (error: unknown) {
    lastHandledShareToken = token
    const message =
      error instanceof Error ? error.message : 'Share token is invalid.'
    setShareStatus('error', message)
    showToast(message, 'error')
  }
}

const renderGenerateBody = (): string => {
  const state = store.getState()

  if (state.catalogStatus === 'loading') {
    return `
      <section class="panel max-w-4xl">
        <div class="flex items-center gap-3 text-[color:var(--text-strong)]">
          ${iconToSvg(LoaderCircle, 'h-5 w-5 animate-spin')}
          <span class="text-sm font-medium">Generate sayfasi hazirlaniyor...</span>
        </div>
      </section>
    `
  }

  if (state.catalogStatus === 'error') {
    return `
      <section class="panel max-w-4xl">
        <h1 class="text-2xl font-bold tracking-tight text-[color:var(--text-strong)]">Generate Scripts</h1>
        <p class="mt-3 text-sm text-[color:var(--text-muted)]">
          Katalog yuklenemedigi icin script olusturma su an kullanilamiyor.
        </p>
      </section>
    `
  }

  const { selectedApps, outputs, activeTab } = getGeneratorViewData(state)
  return renderGenerateView({
    selectedApps,
    outputs,
    activeTab,
    options: state.generatorOptions,
  })
}

const renderAboutView = (): string => `
  <section class="panel max-w-4xl">
    <div class="flex items-center gap-3">
      <span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
        ${iconToSvg(LayoutPanelLeft, 'h-5 w-5')}
      </span>
      <h1 class="text-2xl font-bold tracking-tight text-[color:var(--text-strong)]">AppAnvil Nedir?</h1>
    </div>
    <ul class="mt-3 space-y-2 text-sm text-[color:var(--text-muted)]">
      <li>1. Program secimini toplar.</li>
      <li>2. Winget/Choco/Scoop komutlarini script olarak uretir.</li>
      <li>3. Kurulumu otomatik baslatmaz, kontrol sende kalir.</li>
    </ul>
  </section>
`

const renderShareBody = (): string => {
  const state = store.getState()

  return renderShareView({
    routeToken: currentRoute.kind === 'share' ? currentRoute.token : null,
    status: shareStatus,
    currentShareUrl: getCurrentShareUrl(state),
    selectedCount: state.selectedIds.length,
  })
}

const renderNotFoundView = (path: string): string => `
  <section class="panel max-w-3xl">
    <h1 class="text-2xl font-bold tracking-tight text-[color:var(--text-strong)]">Sayfa Bulunamadi</h1>
    <p class="mt-3 text-sm text-[color:var(--text-muted)]">
      ${escapeHtml(path)} gecerli bir AppAnvil adresi degil.
    </p>
    <a href="#/" class="btn-primary mt-5 inline-flex">Ana Sayfaya Don</a>
  </section>
`

const renderCatalogBody = (): string => {
  const state = store.getState()
  const categories = extractCategories(state.catalog)
  const selectedIds = new Set(state.selectedIds)
  const selectedApps = getSelectedApps(state.catalog, state.selectedIds)
  const searchResults = fuzzySearchCatalog(
    state.catalog,
    catalogSearch,
    state.filters.query,
  )
  const filteredApps = applyCatalogFilters(searchResults, state.filters)
  const paletteResults = getPaletteResults(state)

  const catalogSection =
    state.catalogStatus === 'loading'
      ? `
        <section class="panel">
          <div class="flex items-center gap-3 text-[color:var(--text-strong)]">
            ${iconToSvg(LoaderCircle, 'h-5 w-5 animate-spin')}
            <span class="text-sm font-medium">Katalog yukleniyor...</span>
          </div>
        </section>
      `
      : state.catalogStatus === 'error'
        ? `
          <section class="panel">
            <div class="flex items-start gap-3 text-amber-200">
              ${iconToSvg(AlertTriangle, 'mt-0.5 h-5 w-5')}
              <div>
                <h2 class="text-base font-semibold">Catalog failed to load</h2>
                <p class="mt-1 text-sm">${escapeHtml(state.catalogError ?? 'Unknown error.')}</p>
                <p class="mt-2 text-xs text-[color:var(--text-subtle)]">Tekrar denemek icin sayfayi yenile.</p>
              </div>
            </div>
          </section>
        `
        : renderCatalogPanel({
            apps: filteredApps,
            selectedIds,
            filters: state.filters,
            totalCount: state.catalog.length,
          })

  return `
    <section class="space-y-4">
      <div class="panel">
        <div class="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div class="max-w-3xl">
            <p class="panel-caption">How It Works</p>
            <h1 class="mt-2 text-3xl font-bold leading-tight tracking-tight text-[color:var(--text-strong)] md:text-4xl">
              Programlarini sec, script olustur, bilgisayarina guvenli sekilde kur.
            </h1>
            <p class="mt-3 text-sm text-[color:var(--text-muted)] md:text-base">
              Bu site hicbir kurulumu otomatik calistirmaz. Sadece script uretir.
            </p>
          </div>

          <div class="rounded-xl border border-[color:var(--panel-border)] bg-[color:var(--panel-soft)] p-3">
            <p class="panel-caption">3 Adim</p>
            <ol class="mt-2 space-y-2 text-sm text-[color:var(--text-muted)]">
              <li><span class="font-semibold text-[color:var(--text-strong)]">1.</span> Sol taraftan filtrele, ortadan program sec.</li>
              <li><span class="font-semibold text-[color:var(--text-strong)]">2.</span> Sagdaki sepetten <strong>Generate</strong> sayfasina gec.</li>
              <li><span class="font-semibold text-[color:var(--text-strong)]">3.</span> Scripti indir, calistirmadan once satirlari kontrol et.</li>
            </ol>
          </div>

          <div class="flex flex-wrap gap-2 lg:hidden">
            <button
              type="button"
              data-open-drawer="filters-drawer"
              class="btn-ghost"
              aria-controls="filters-drawer"
              aria-label="Open filters panel"
            >
              ${iconToSvg(SlidersHorizontal, 'h-4 w-4')}
              Filtreler
            </button>
            <button
              type="button"
              data-open-drawer="cart-drawer"
              class="btn-ghost"
              aria-controls="cart-drawer"
              aria-label="Open cart drawer"
            >
              ${iconToSvg(ShoppingBag, 'h-4 w-4')}
              Sepet
            </button>
          </div>
        </div>
      </div>

      <div class="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)_280px]">
        <aside class="hidden lg:block">
          <div class="rail-pane sticky top-4">
            ${renderFiltersPanel({ filters: state.filters, categories })}
          </div>
        </aside>

        <section class="min-w-0">${catalogSection}</section>

        <aside class="hidden lg:block">
          <div class="rail-pane sticky top-4">
            ${renderCartPanel({ selectedApps, placement: 'desktop' })}
          </div>
        </aside>
      </div>

      <div
        id="filters-drawer"
        data-drawer-id="filters-drawer"
        class="hidden lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
      >
        <div class="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm">
          <button
            type="button"
            data-close-drawer="filters-drawer"
            class="h-full w-full cursor-default"
            aria-label="Close filters drawer"
          ></button>
        </div>
        <div class="fixed inset-y-0 left-0 z-50 w-[88%] max-w-xs p-3">
          ${renderFiltersPanel({ filters: state.filters, categories })}
          <button type="button" data-close-drawer="filters-drawer" class="btn-ghost mt-3 w-full">
            Filtreleri Kapat
          </button>
        </div>
      </div>

      <div
        id="cart-drawer"
        data-drawer-id="cart-drawer"
        class="hidden lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
      >
        <div class="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm">
          <button
            type="button"
            data-close-drawer="cart-drawer"
            class="h-full w-full cursor-default"
            aria-label="Close cart drawer"
          ></button>
        </div>
        <div class="fixed inset-x-0 bottom-0 z-50 p-3">
          <div class="glass rounded-2xl p-1.5">
            ${renderCartPanel({ selectedApps, placement: 'mobile' })}
            <button type="button" data-close-drawer="cart-drawer" class="btn-ghost mt-3 w-full">
              Sepeti Kapat
            </button>
          </div>
        </div>
      </div>

      <div class="fixed inset-x-0 bottom-0 z-30 border-t border-[color:var(--panel-border)] bg-[color:var(--panel-surface)] px-4 py-2.5 backdrop-blur lg:hidden">
        <button
          type="button"
          data-open-drawer="cart-drawer"
          class="btn-primary mx-auto flex w-full max-w-md justify-center"
          aria-controls="cart-drawer"
          aria-label="Open cart drawer"
        >
          ${iconToSvg(ShoppingBag, 'h-4 w-4')}
          Sepeti Ac (${selectedApps.length})
        </button>
      </div>

      ${renderCommandPalette({
        open: state.commandPaletteOpen,
        query: state.commandPaletteQuery,
        selectedIds,
        results: paletteResults,
        activeIndex: state.commandPaletteIndex,
      })}
    </section>
  `
}

const renderRouteView = (): string => {
  if (currentRoute.kind === 'home') {
    return renderCatalogBody()
  }
  if (currentRoute.kind === 'generate') {
    return renderGenerateBody()
  }
  if (currentRoute.kind === 'about') {
    return renderAboutView()
  }
  if (currentRoute.kind === 'share') {
    return renderShareBody()
  }
  return renderNotFoundView(currentRoute.path)
}

const copyShareLink = async (): Promise<void> => {
  const shareUrl = getCurrentShareUrl()
  if (!shareUrl) {
    showToast('Select at least one app before creating a share link.', 'info')
    return
  }

  try {
    await navigator.clipboard.writeText(shareUrl)
    showToast('Share URL copied to clipboard.', 'success')
  } catch {
    showToast('Clipboard permission denied. Copy manually from the UI.', 'error')
  }
}

const downloadTextFile = (
  content: string,
  filename: string,
  mimeType = 'text/plain;charset=utf-8',
): void => {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const copyGenerateOutput = async (tab: GenerateTab): Promise<void> => {
  const { outputs } = getGeneratorViewData()
  if (!outputs) {
    showToast('No generated output available.', 'error')
    return
  }

  const content = getGenerateOutputContent(outputs, tab)
  try {
    await navigator.clipboard.writeText(content)
    showToast('Output copied to clipboard.', 'success')
  } catch {
    showToast('Clipboard permission denied.', 'error')
  }
}

const downloadGenerateOutput = (tab: GenerateTab): void => {
  const { outputs } = getGeneratorViewData()
  if (!outputs) {
    showToast('No generated output available.', 'error')
    return
  }

  const content = getGenerateOutputContent(outputs, tab)
  const filename = getGenerateFilename(tab)
  const mimeType =
    tab === 'json'
      ? 'application/json;charset=utf-8'
      : 'text/plain;charset=utf-8'

  downloadTextFile(content, filename, mimeType)
  showToast(`Downloaded ${filename}`, 'success')
}

const wireHomeInteractions = (): void => {
  const onClick = (event: Event): void => {
    const target = event.target as HTMLElement
    const button = target.closest<HTMLElement>('[data-action]')
    if (!button) {
      return
    }

    const action = button.dataset.action
    if (action === 'toggle-app' || action === 'palette-toggle') {
      const appId = button.dataset.appId
      if (appId) {
        store.toggleSelectedApp(appId)
      }
      if (action === 'palette-toggle') {
        store.setCommandPaletteQuery('')
      }
      return
    }

    if (action === 'clear-selection') {
      store.clearSelectedApps()
      return
    }

    if (action === 'reset-filters') {
      store.resetFilters()
      return
    }

    if (action === 'copy-share-link') {
      void copyShareLink()
      return
    }

    if (action === 'close-command-palette') {
      store.closeCommandPalette()
    }
  }

  const onInput = (event: Event): void => {
    const target = event.target as HTMLInputElement
    const filter = target.dataset.filter

    if (filter === 'query') {
      store.setFilterQuery(target.value)
      return
    }

    if (filter === 'palette-query') {
      store.setCommandPaletteQuery(target.value)
    }
  }

  const onChange = (event: Event): void => {
    const target = event.target as HTMLInputElement | HTMLSelectElement
    const filter = target.dataset.filter

    if (filter === 'category' && target instanceof HTMLInputElement) {
      store.toggleCategory(target.value)
      return
    }

    if (filter === 'provider' && target instanceof HTMLInputElement) {
      const provider = target.value as ProviderKey
      store.setProviderFilter(provider, target.checked)
      return
    }

    if (filter === 'popular-only' && target instanceof HTMLInputElement) {
      store.setPopularOnly(target.checked)
      return
    }

    if (filter === 'sort' && target instanceof HTMLSelectElement) {
      const sortMode = target.value as SortMode
      store.setSortMode(sortMode)
    }
  }

  const onKeyDown = (event: KeyboardEvent): void => {
    const state = store.getState()
    const paletteOpen = state.commandPaletteOpen
    const isShortcut =
      (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k'

    if (isShortcut) {
      event.preventDefault()
      store.setCommandPaletteOpen(true)
      return
    }

    if (!paletteOpen) {
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      store.closeCommandPalette()
      return
    }

    const results = getPaletteResults(state)
    const maxIndex = Math.max(0, results.length - 1)

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      const next = Math.min(state.commandPaletteIndex + 1, maxIndex)
      store.setCommandPaletteIndex(next)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      const next = Math.max(state.commandPaletteIndex - 1, 0)
      store.setCommandPaletteIndex(next)
      return
    }

    if (event.key === 'Enter' && results.length > 0) {
      event.preventDefault()
      const active = results[state.commandPaletteIndex] ?? results[0]
      if (active) {
        store.toggleSelectedApp(active.id)
      }
    }
  }

  document.addEventListener('click', onClick)
  document.addEventListener('input', onInput)
  document.addEventListener('change', onChange)
  document.addEventListener('keydown', onKeyDown)

  cleanupListeners.push(() => document.removeEventListener('click', onClick))
  cleanupListeners.push(() => document.removeEventListener('input', onInput))
  cleanupListeners.push(() => document.removeEventListener('change', onChange))
  cleanupListeners.push(() => document.removeEventListener('keydown', onKeyDown))
}

const wireGenerateInteractions = (): void => {
  const onClick = (event: Event): void => {
    const target = event.target as HTMLElement
    const button = target.closest<HTMLElement>('[data-action]')
    if (!button) {
      return
    }

    const action = button.dataset.action
    if (action === 'set-generate-tab') {
      const tab = button.dataset.tab
      if (tab && isGenerateTab(tab)) {
        store.setGenerateActiveTab(tab)
      }
      return
    }

    if (action === 'copy-generate-output') {
      const tab = button.dataset.tab
      const resolvedTab =
        tab && isGenerateTab(tab)
          ? tab
          : resolveGenerateTab(
              store.getState().generateActiveTab,
              getGeneratorViewData().outputs,
            )
      void copyGenerateOutput(resolvedTab)
      return
    }

    if (action === 'download-generate-output') {
      const tab = button.dataset.tab
      const resolvedTab =
        tab && isGenerateTab(tab)
          ? tab
          : resolveGenerateTab(
              store.getState().generateActiveTab,
              getGeneratorViewData().outputs,
            )
      downloadGenerateOutput(resolvedTab)
      return
    }

    if (action === 'download-installer-cmd') {
      downloadGenerateOutput('installer')
    }
  }

  const onChange = (event: Event): void => {
    const target = event.target
    if (!(target instanceof HTMLInputElement)) {
      return
    }

    const optionKey = target.dataset.generatorOption
    if (!optionKey || !isGeneratorOptionKey(optionKey)) {
      return
    }

    store.setGeneratorOption(optionKey, target.checked)
  }

  document.addEventListener('click', onClick)
  document.addEventListener('change', onChange)

  cleanupListeners.push(() => document.removeEventListener('click', onClick))
  cleanupListeners.push(() => document.removeEventListener('change', onChange))
}

const wireShareInteractions = (): void => {
  const onClick = (event: Event): void => {
    const target = event.target as HTMLElement
    const button = target.closest<HTMLElement>('[data-action]')
    if (!button) {
      return
    }

    const action = button.dataset.action
    if (action === 'copy-current-share-url') {
      void copyShareLink()
      return
    }

    if (action === 'import-share-text') {
      const input = document.querySelector<HTMLTextAreaElement>(
        '[data-share-import-input]',
      )

      if (!input) {
        return
      }

      try {
        importFromText(input.value)
        input.value = ''
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Import failed.'
        setShareStatus('error', message)
        showToast(message, 'error')
      }
    }
  }

  const onChange = (event: Event): void => {
    const target = event.target
    if (!(target instanceof HTMLInputElement)) {
      return
    }

    if (target.dataset.shareJsonFile !== '') {
      return
    }

    const file = target.files?.[0]
    if (!file) {
      return
    }

    void file
      .text()
      .then((text) => {
        const payload = parseSelectionJsonPayload(text)
        applyImportedPayload(
          payload,
          `Imported ${payload.selectedIds.length} app(s) from JSON file.`,
        )
      })
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'JSON import failed.'
        setShareStatus('error', message)
        showToast(message, 'error')
      })
      .finally(() => {
        target.value = ''
      })
  }

  document.addEventListener('click', onClick)
  document.addEventListener('change', onChange)

  cleanupListeners.push(() => document.removeEventListener('click', onClick))
  cleanupListeners.push(() => document.removeEventListener('change', onChange))
}

const renderApp = (): void => {
  resetListeners()

  app.innerHTML = `
    <div class="relative min-h-screen overflow-x-clip">
      <div class="aurora"></div>
      <div class="surface-grid"></div>
      <div class="lens-vignette"></div>

      <div class="relative z-10 mx-auto flex min-h-screen w-full max-w-[1540px] flex-col px-3 py-3 pb-24 md:px-8 md:py-6 md:pb-10">
        ${renderHeader(currentRoute)}

        <main class="mt-3 flex-1" id="route-content">
          ${renderRouteView()}
        </main>
      </div>
    </div>
  `

  cleanupListeners.push(wireHeader())

  if (currentRoute.kind === 'home') {
    wireHomeInteractions()
    cleanupListeners.push(wireDrawerControls())

    const state = store.getState()
    if (state.commandPaletteOpen) {
      const paletteInput = document.querySelector<HTMLInputElement>(
        '#command-palette-input',
      )
      if (paletteInput) {
        paletteInput.focus()
        const length = paletteInput.value.length
        paletteInput.setSelectionRange(length, length)
      }
    }
  }

  if (currentRoute.kind === 'generate') {
    wireGenerateInteractions()
  }

  if (currentRoute.kind === 'share') {
    wireShareInteractions()
  }
}

void loadCatalog()
  .then((catalog) => {
    catalogSearch = createCatalogSearch(catalog)
    store.setCatalog(catalog)
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown catalog error.'
    store.setCatalogError(message)
  })

store.subscribe(() => {
  renderApp()
})

initRouter((route) => {
  currentRoute = route
  if (route.kind === 'share') {
    handleRouteShareToken(route.token)
  }
  renderApp()
})
