import {
  AppWindow,
  Check,
  Clapperboard,
  CodeXml,
  Gamepad2,
  Globe,
  MessageSquare,
  NotebookText,
  Plus,
  Search,
  ShieldCheck,
  TriangleAlert,
  Wrench,
  createElement,
} from 'lucide'
import type { IconNode } from 'lucide'
import type { CatalogApp } from '../../data/schema'
import type { CatalogFilters } from './filters'

interface FiltersPanelProps {
  filters: CatalogFilters
  categories: string[]
}

interface CatalogPanelProps {
  apps: CatalogApp[]
  selectedIds: Set<string>
  filters: CatalogFilters
  totalCount: number
}

interface CommandPaletteProps {
  open: boolean
  query: string
  selectedIds: Set<string>
  results: CatalogApp[]
  activeIndex: number
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

const iconForCategory = (category: string): IconNode => {
  if (category === 'Browsers') return Globe
  if (category === 'Developer Tools') return CodeXml
  if (category === 'Utilities') return Wrench
  if (category === 'Communication') return MessageSquare
  if (category === 'Security') return ShieldCheck
  if (category === 'Media') return Clapperboard
  if (category === 'Gaming') return Gamepad2
  if (category === 'Productivity') return NotebookText
  return AppWindow
}

const renderProviders = (app: CatalogApp): string => {
  const tags: string[] = []

  if (app.providers.winget) {
    tags.push('<span class="chip">Winget</span>')
  }
  if (app.providers.choco) {
    tags.push('<span class="chip">Choco</span>')
  }
  if (app.providers.scoop) {
    tags.push('<span class="chip">Scoop</span>')
  }

  return tags.join('')
}

const renderCard = (app: CatalogApp, selected: boolean): string => {
  const categoryIcon = iconForCategory(app.category)
  const appName = escapeHtml(app.name)
  const appDescription = escapeHtml(app.description)

  return `
    <article class="panel group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(9,20,38,0.14)] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
      <div class="flex items-start justify-between gap-3">
        <div class="flex min-w-0 items-start gap-3">
          <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
            ${iconToSvg(categoryIcon, 'h-5 w-5')}
          </span>
          <div class="min-w-0">
            <h3 class="truncate text-base font-semibold text-[color:var(--text-strong)]">${appName}</h3>
            <p class="mt-1 text-sm text-[color:var(--text-muted)]">${appDescription}</p>
          </div>
        </div>
        ${app.needsVerification ? `<span class="chip bg-amber-100/80 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">${iconToSvg(TriangleAlert, 'mr-1 h-3.5 w-3.5')}Verify</span>` : ''}
      </div>

      <div class="mt-4 flex flex-wrap gap-2">${renderProviders(app)}</div>

      <div class="mt-3 flex flex-wrap gap-2">
        ${app.tags
          .slice(0, 4)
          .map(
            (tag) =>
              `<span class="rounded-full border border-[color:var(--panel-border)] px-2.5 py-1 text-xs text-[color:var(--text-subtle)]">${escapeHtml(tag)}</span>`,
          )
          .join('')}
      </div>

      <button
        type="button"
        data-action="toggle-app"
        data-app-id="${escapeHtml(app.id)}"
        class="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${selected ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'border border-[color:var(--panel-border)] bg-[color:var(--panel-surface)] text-[color:var(--text-strong)] hover:bg-[color:var(--panel-soft)]'}"
        aria-label="${selected ? 'Remove' : 'Add'} ${appName}"
      >
        ${selected ? iconToSvg(Check, 'h-4 w-4') : iconToSvg(Plus, 'h-4 w-4')}
        ${selected ? 'Remove' : 'Add to Cart'}
      </button>
    </article>
  `
}

export const renderFiltersPanel = ({
  filters,
  categories,
}: FiltersPanelProps): string => `
  <section class="panel h-full">
    <div class="flex items-center justify-between gap-2">
      <h2 class="panel-title">Filters</h2>
      <button
        type="button"
        data-action="reset-filters"
        class="focus-ring rounded-lg border border-[color:var(--panel-border)] px-3 py-1.5 text-xs font-semibold text-[color:var(--text-muted)] hover:bg-[color:var(--panel-soft)]"
      >
        Reset
      </button>
    </div>

    <div class="mt-4 space-y-4">
      <label class="flex items-center justify-between gap-3 rounded-xl border border-[color:var(--panel-border)] px-3 py-2">
        <span class="text-sm font-medium text-[color:var(--text-strong)]">Popular only</span>
        <input
          type="checkbox"
          data-filter="popular-only"
          ${filters.popularOnly ? 'checked' : ''}
          class="h-4 w-4 accent-emerald-600"
        />
      </label>

      <fieldset class="space-y-2">
        <legend class="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-subtle)]">Providers</legend>
        <label class="flex items-center gap-2 text-sm text-[color:var(--text-strong)]">
          <input type="checkbox" data-filter="provider" value="winget" ${filters.providers.winget ? 'checked' : ''} class="h-4 w-4 accent-emerald-600" />
          Winget
        </label>
        <label class="flex items-center gap-2 text-sm text-[color:var(--text-strong)]">
          <input type="checkbox" data-filter="provider" value="choco" ${filters.providers.choco ? 'checked' : ''} class="h-4 w-4 accent-emerald-600" />
          Chocolatey
        </label>
        <label class="flex items-center gap-2 text-sm text-[color:var(--text-strong)]">
          <input type="checkbox" data-filter="provider" value="scoop" ${filters.providers.scoop ? 'checked' : ''} class="h-4 w-4 accent-emerald-600" />
          Scoop
        </label>
      </fieldset>

      <fieldset class="space-y-2">
        <legend class="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-subtle)]">Categories</legend>
        <div class="max-h-[280px] space-y-1 overflow-y-auto pr-1">
          ${categories
            .map(
              (category) => `
                <label class="flex items-center gap-2 text-sm text-[color:var(--text-strong)]">
                  <input
                    type="checkbox"
                    data-filter="category"
                    value="${escapeHtml(category)}"
                    ${filters.categories.includes(category) ? 'checked' : ''}
                    class="h-4 w-4 accent-emerald-600"
                  />
                  ${escapeHtml(category)}
                </label>
              `,
            )
            .join('')}
        </div>
      </fieldset>
    </div>
  </section>
`

export const renderCatalogPanel = ({
  apps,
  selectedIds,
  filters,
  totalCount,
}: CatalogPanelProps): string => `
  <section class="space-y-4">
    <div class="panel">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="panel-title">App Catalog</h2>
          <p class="mt-1 text-xs text-[color:var(--text-subtle)]">${apps.length} shown of ${totalCount} total</p>
        </div>

        <div class="flex items-center gap-2">
          <label class="relative block min-w-[220px]">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]">
              ${iconToSvg(Search, 'h-4 w-4')}
            </span>
            <input
              type="search"
              value="${escapeHtml(filters.query)}"
              data-filter="query"
              placeholder="Search name, tags, descriptions"
              class="focus-ring h-11 w-full rounded-xl border border-[color:var(--panel-border)] bg-[color:var(--panel-surface)] pl-10 pr-4 text-sm text-[color:var(--text-strong)] placeholder:text-[color:var(--text-muted)]"
            />
          </label>

          <select
            data-filter="sort"
            class="focus-ring h-11 rounded-xl border border-[color:var(--panel-border)] bg-[color:var(--panel-surface)] px-3 text-sm text-[color:var(--text-strong)]"
            aria-label="Sort apps"
          >
            <option value="popularity" ${filters.sort === 'popularity' ? 'selected' : ''}>Popularity</option>
            <option value="name" ${filters.sort === 'name' ? 'selected' : ''}>Name A-Z</option>
            <option value="recent" ${filters.sort === 'recent' ? 'selected' : ''}>Recently Added</option>
          </select>
        </div>
      </div>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-2">
      ${apps.map((app) => renderCard(app, selectedIds.has(app.id))).join('')}
    </div>
  </section>
`

export const renderCommandPalette = ({
  open,
  query,
  selectedIds,
  results,
  activeIndex,
}: CommandPaletteProps): string => `
  <div id="command-palette" class="${open ? '' : 'hidden'}" role="dialog" aria-modal="true" aria-label="Command palette">
    <div class="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm" data-action="close-command-palette"></div>
    <div class="fixed inset-x-0 top-[10vh] z-50 mx-auto w-[92%] max-w-2xl">
      <section class="glass rounded-2xl border border-[color:var(--panel-border)] p-3">
        <label class="relative block">
          <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]">
            ${iconToSvg(Search, 'h-4 w-4')}
          </span>
          <input
            id="command-palette-input"
            type="text"
            value="${escapeHtml(query)}"
            data-filter="palette-query"
            placeholder="Type an app name and press Enter to toggle"
            class="focus-ring h-11 w-full rounded-xl border border-[color:var(--panel-border)] bg-[color:var(--panel-surface)] pl-10 pr-4 text-sm text-[color:var(--text-strong)] placeholder:text-[color:var(--text-muted)]"
            aria-label="Command palette search input"
          />
        </label>

        <ul class="mt-3 max-h-[55vh] space-y-1 overflow-y-auto" aria-label="Command palette results">
          ${
            results.length === 0
              ? '<li class="rounded-xl border border-dashed border-[color:var(--panel-border)] px-3 py-4 text-sm text-[color:var(--text-muted)]">No matching apps.</li>'
              : results
                  .map((app, index) => {
                    const isSelected = selectedIds.has(app.id)
                    const isActive = index === activeIndex

                    return `
                      <li>
                        <button
                          type="button"
                          data-action="palette-toggle"
                          data-app-id="${escapeHtml(app.id)}"
                          class="focus-ring flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm ${isActive ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]' : 'hover:bg-[color:var(--panel-soft)]'}"
                        >
                          <span class="truncate">${escapeHtml(app.name)}</span>
                          <span class="chip">${isSelected ? 'Selected' : 'Add'}</span>
                        </button>
                      </li>
                    `
                  })
                  .join('')
          }
        </ul>

        <p class="mt-2 text-xs text-[color:var(--text-subtle)]">
          <kbd class="rounded border border-[color:var(--panel-border)] px-1.5 py-0.5">Ctrl/Cmd + K</kbd>
          open,
          <kbd class="rounded border border-[color:var(--panel-border)] px-1.5 py-0.5">Enter</kbd>
          toggle,
          <kbd class="rounded border border-[color:var(--panel-border)] px-1.5 py-0.5">Esc</kbd>
          close.
        </p>
      </section>
    </div>
  </div>
`
