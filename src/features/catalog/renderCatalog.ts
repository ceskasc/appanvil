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

const renderProviderBadges = (app: CatalogApp): string => {
  const badges: string[] = []

  if (app.providers.winget) {
    badges.push(
      '<span class="provider-pill border-sky-300/50 text-sky-700 dark:border-sky-400/45 dark:text-sky-300">Winget</span>',
    )
  }
  if (app.providers.choco) {
    badges.push(
      '<span class="provider-pill border-amber-300/50 text-amber-700 dark:border-amber-400/45 dark:text-amber-300">Choco</span>',
    )
  }
  if (app.providers.scoop) {
    badges.push(
      '<span class="provider-pill border-emerald-300/50 text-emerald-700 dark:border-emerald-400/45 dark:text-emerald-300">Scoop</span>',
    )
  }

  return badges.join('')
}

const renderTagBadges = (tags: string[]): string =>
  tags
    .slice(0, 3)
    .map(
      (tag) =>
        `<span class="tag-pill" title="${escapeHtml(tag)}">${escapeHtml(tag)}</span>`,
    )
    .join('')

const renderRow = (app: CatalogApp, selected: boolean): string => {
  const categoryIcon = iconForCategory(app.category)
  const appName = escapeHtml(app.name)
  const appDescription = escapeHtml(app.description)
  const logoUrl = `https://www.google.com/s2/favicons?sz=128&domain_url=${encodeURIComponent(app.homepage)}`

  return `
    <article class="app-row">
      <div class="flex min-w-0 flex-1 items-start gap-3">
        <span class="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/80 p-1 shadow-[inset_0_0_0_1px_rgba(100,140,180,0.22)] dark:bg-slate-900/62 dark:shadow-[inset_0_0_0_1px_rgba(130,170,210,0.22)]">
          <img
            src="${logoUrl}"
            alt="${appName} logo"
            class="h-full w-full rounded object-contain"
            loading="lazy"
            decoding="async"
            referrerpolicy="no-referrer"
          />
        </span>

        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-1.5">
            <h3 class="truncate text-sm font-semibold text-[color:var(--text-strong)]">${appName}</h3>
            <span class="chip">
              ${iconToSvg(categoryIcon, 'mr-1 h-3 w-3')}
              ${escapeHtml(app.category)}
            </span>
            ${
              app.needsVerification
                ? `<span class="chip border-amber-300/60 text-amber-700 dark:border-amber-400/45 dark:text-amber-300">${iconToSvg(TriangleAlert, 'mr-1 h-3 w-3')}Verify</span>`
                : ''
            }
          </div>

          <p class="mt-1 truncate text-[13px] text-[color:var(--text-muted)]">${appDescription}</p>

          <div class="mt-2 flex flex-wrap items-center gap-1.5">
            ${renderProviderBadges(app)}
            ${renderTagBadges(app.tags)}
          </div>
        </div>
      </div>

      <button
        type="button"
        data-action="toggle-app"
        data-app-id="${escapeHtml(app.id)}"
        class="focus-ring ml-2 inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
          selected
            ? 'border-emerald-400/50 bg-emerald-500/14 text-emerald-700 dark:border-emerald-400/45 dark:text-emerald-300'
            : 'border-[color:var(--panel-border)] bg-[color:var(--panel-surface)] text-[color:var(--text-strong)] hover:bg-[color:var(--panel-soft)]'
        }"
        aria-label="${selected ? 'Remove' : 'Add'} ${appName}"
      >
        ${selected ? iconToSvg(Check, 'h-3.5 w-3.5') : iconToSvg(Plus, 'h-3.5 w-3.5')}
        ${selected ? 'Remove' : 'Add'}
      </button>
    </article>
  `
}

export const renderFiltersPanel = ({
  filters,
  categories,
}: FiltersPanelProps): string => `
  <section class="panel space-y-4">
    <div class="flex items-center justify-between gap-2">
      <h2 class="panel-title">Filters</h2>
      <button
        type="button"
        data-action="reset-filters"
        class="btn-inline"
      >
        Reset
      </button>
    </div>

    <label class="flex items-center justify-between rounded-lg bg-[color:var(--panel-surface)] px-3 py-2">
      <span class="text-sm font-medium text-[color:var(--text-strong)]">Popular only</span>
      <input
        type="checkbox"
        data-filter="popular-only"
        ${filters.popularOnly ? 'checked' : ''}
        class="h-4 w-4 accent-sky-600 dark:accent-sky-400"
      />
    </label>

    <fieldset class="space-y-2">
      <legend class="panel-caption">Providers</legend>
      <div class="space-y-1">
        <label class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-[color:var(--text-strong)] transition-colors hover:bg-[color:var(--panel-soft)]">
          <input type="checkbox" data-filter="provider" value="winget" ${filters.providers.winget ? 'checked' : ''} class="h-4 w-4 accent-sky-600 dark:accent-sky-400" />
          Winget
        </label>
        <label class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-[color:var(--text-strong)] transition-colors hover:bg-[color:var(--panel-soft)]">
          <input type="checkbox" data-filter="provider" value="choco" ${filters.providers.choco ? 'checked' : ''} class="h-4 w-4 accent-sky-600 dark:accent-sky-400" />
          Chocolatey
        </label>
        <label class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-[color:var(--text-strong)] transition-colors hover:bg-[color:var(--panel-soft)]">
          <input type="checkbox" data-filter="provider" value="scoop" ${filters.providers.scoop ? 'checked' : ''} class="h-4 w-4 accent-sky-600 dark:accent-sky-400" />
          Scoop
        </label>
      </div>
    </fieldset>

    <fieldset class="space-y-2">
      <legend class="panel-caption">Categories</legend>
      <div class="max-h-[340px] space-y-1 overflow-y-auto pr-1">
        ${categories
          .map(
            (category) => `
              <label class="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-[color:var(--text-strong)] transition-colors hover:bg-[color:var(--panel-soft)]">
                <input
                  type="checkbox"
                  data-filter="category"
                  value="${escapeHtml(category)}"
                  ${filters.categories.includes(category) ? 'checked' : ''}
                  class="h-4 w-4 accent-sky-600 dark:accent-sky-400"
                />
                ${escapeHtml(category)}
              </label>
            `,
          )
          .join('')}
      </div>
    </fieldset>
  </section>
`

export const renderCatalogPanel = ({
  apps,
  selectedIds,
  filters,
  totalCount,
}: CatalogPanelProps): string => `
  <section class="panel space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="panel-title">Catalog</h2>
        <p class="mt-1 text-xs text-[color:var(--text-subtle)]">${apps.length} shown of ${totalCount}</p>
      </div>

      <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
        <label class="relative block min-w-[220px] flex-1 sm:w-[360px]">
          <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]">
            ${iconToSvg(Search, 'h-4 w-4')}
          </span>
          <input
            type="search"
            value="${escapeHtml(filters.query)}"
            data-filter="query"
            placeholder="Search apps, tags, descriptions"
            class="focus-ring h-10 w-full rounded-xl border border-[color:var(--panel-border)] bg-[color:var(--panel-surface)] pl-10 pr-3 text-sm text-[color:var(--text-strong)] placeholder:text-[color:var(--text-muted)]"
          />
        </label>

        <select
          data-filter="sort"
          class="focus-ring h-10 rounded-xl border border-[color:var(--panel-border)] bg-[color:var(--panel-surface)] px-3 text-sm text-[color:var(--text-strong)]"
          aria-label="Sort apps"
        >
          <option value="popularity" ${filters.sort === 'popularity' ? 'selected' : ''}>Popularity</option>
          <option value="name" ${filters.sort === 'name' ? 'selected' : ''}>Name A-Z</option>
          <option value="recent" ${filters.sort === 'recent' ? 'selected' : ''}>Recently Added</option>
        </select>
      </div>
    </div>

    <div class="app-list">
      ${
        apps.length === 0
          ? `
            <div class="px-4 py-8 text-center text-sm text-[color:var(--text-muted)]">
              No apps match the current filters.
            </div>
          `
          : apps.map((app) => renderRow(app, selectedIds.has(app.id))).join('')
      }
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
    <div class="fixed inset-0 z-40 bg-slate-950/44 backdrop-blur-sm" data-action="close-command-palette"></div>
    <div class="fixed inset-x-0 top-[9vh] z-50 mx-auto w-[92%] max-w-2xl">
      <section class="glass rounded-2xl p-3">
        <label class="relative block">
          <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]">
            ${iconToSvg(Search, 'h-4 w-4')}
          </span>
          <input
            id="command-palette-input"
            type="text"
            value="${escapeHtml(query)}"
            data-filter="palette-query"
            placeholder="Type app name and press Enter"
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
                          class="focus-ring flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                            isActive
                              ? 'bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]'
                              : 'text-[color:var(--text-strong)] hover:bg-[color:var(--panel-soft)]'
                          }"
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
