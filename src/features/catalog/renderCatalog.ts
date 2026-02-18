import { Check, Search, TriangleAlert, createElement } from 'lucide'
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

const groupByCategory = (apps: CatalogApp[]): Array<[string, CatalogApp[]]> => {
  const grouped = new Map<string, CatalogApp[]>()

  for (const app of apps) {
    const existing = grouped.get(app.category)
    if (existing) {
      existing.push(app)
      continue
    }
    grouped.set(app.category, [app])
  }

  return [...grouped.entries()].sort((left, right) =>
    left[0].localeCompare(right[0]),
  )
}

const renderProviderHint = (app: CatalogApp): string => {
  const hints: string[] = []
  if (app.providers.winget) hints.push('W')
  if (app.providers.choco) hints.push('C')
  if (app.providers.scoop) hints.push('S')
  return hints.join(' / ')
}

const renderCatalogItem = (app: CatalogApp, selected: boolean): string => {
  const appName = escapeHtml(app.name)
  const logoUrl = `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(app.homepage)}`

  return `
    <li>
      <button
        type="button"
        data-action="toggle-app"
        data-app-id="${escapeHtml(app.id)}"
        class="catalog-item ${selected ? 'is-selected' : ''}"
        aria-pressed="${selected}"
        aria-label="${selected ? 'Remove' : 'Add'} ${appName}"
      >
        <span class="checkbox">
          ${selected ? iconToSvg(Check, 'h-3 w-3') : ''}
        </span>
        <img
          src="${logoUrl}"
          alt=""
          class="catalog-item-logo"
          loading="lazy"
          decoding="async"
          referrerpolicy="no-referrer"
        />
        <span class="truncate">${appName}</span>
        <span class="ml-auto text-[10px] font-semibold uppercase tracking-[0.1em] text-[color:var(--text-subtle)]">${renderProviderHint(app)}</span>
        ${
          app.needsVerification
            ? `<span class="text-amber-500">${iconToSvg(TriangleAlert, 'h-3.5 w-3.5')}</span>`
            : ''
        }
      </button>
    </li>
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

    <label class="flex items-center justify-between rounded-md bg-[color:var(--panel-soft)] px-3 py-2">
      <span class="text-sm font-medium text-[color:var(--text-strong)]">Popular only</span>
      <input
        type="checkbox"
        data-filter="popular-only"
        ${filters.popularOnly ? 'checked' : ''}
        class="h-4 w-4 accent-[color:var(--accent-strong)]"
      />
    </label>

    <fieldset class="space-y-2">
      <legend class="panel-caption">Providers</legend>
      <div class="space-y-1">
        <label class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[color:var(--text-strong)] hover:bg-[color:var(--panel-soft)]">
          <input type="checkbox" data-filter="provider" value="winget" ${filters.providers.winget ? 'checked' : ''} class="h-4 w-4 accent-[color:var(--accent-strong)]" />
          Winget
        </label>
        <label class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[color:var(--text-strong)] hover:bg-[color:var(--panel-soft)]">
          <input type="checkbox" data-filter="provider" value="choco" ${filters.providers.choco ? 'checked' : ''} class="h-4 w-4 accent-[color:var(--accent-strong)]" />
          Chocolatey
        </label>
        <label class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[color:var(--text-strong)] hover:bg-[color:var(--panel-soft)]">
          <input type="checkbox" data-filter="provider" value="scoop" ${filters.providers.scoop ? 'checked' : ''} class="h-4 w-4 accent-[color:var(--accent-strong)]" />
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
              <label class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[color:var(--text-strong)] hover:bg-[color:var(--panel-soft)]">
                <input
                  type="checkbox"
                  data-filter="category"
                  value="${escapeHtml(category)}"
                  ${filters.categories.includes(category) ? 'checked' : ''}
                  class="h-4 w-4 accent-[color:var(--accent-strong)]"
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
}: CatalogPanelProps): string => {
  const grouped = groupByCategory(apps)

  return `
    <section class="panel space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 class="panel-title">Pick the apps you want</h2>
          <p class="mt-1 text-xs text-[color:var(--text-subtle)]">${apps.length} shown of ${totalCount}</p>
        </div>

        <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <label class="relative block min-w-[220px] flex-1 sm:w-[320px]">
            <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]">
              ${iconToSvg(Search, 'h-4 w-4')}
            </span>
            <input
              type="search"
              value="${escapeHtml(filters.query)}"
              data-filter="query"
              placeholder="Search apps"
              class="focus-ring h-10 w-full rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel-surface)] pl-10 pr-3 text-sm text-[color:var(--text-strong)] placeholder:text-[color:var(--text-muted)]"
            />
          </label>

          <select
            data-filter="sort"
            class="focus-ring h-10 rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel-surface)] px-3 text-sm text-[color:var(--text-strong)]"
            aria-label="Sort apps"
          >
            <option value="popularity" ${filters.sort === 'popularity' ? 'selected' : ''}>Popularity</option>
            <option value="name" ${filters.sort === 'name' ? 'selected' : ''}>Name A-Z</option>
            <option value="recent" ${filters.sort === 'recent' ? 'selected' : ''}>Recently Added</option>
          </select>
        </div>
      </div>

      ${
        apps.length === 0
          ? `
            <div class="rounded-md border border-dashed border-[color:var(--panel-border)] px-4 py-8 text-center text-sm text-[color:var(--text-muted)]">
              No apps match your filters.
            </div>
          `
          : `
            <div class="app-list">
              ${grouped
                .map(
                  ([category, categoryApps]) => `
                    <section class="category-block">
                      <h3 class="text-sm font-semibold text-[color:var(--text-strong)]">${escapeHtml(category)}</h3>
                      <ul class="mt-2 space-y-0.5">
                        ${categoryApps
                          .map((app) => renderCatalogItem(app, selectedIds.has(app.id)))
                          .join('')}
                      </ul>
                    </section>
                  `,
                )
                .join('')}
            </div>
          `
      }
    </section>
  `
}

export const renderCommandPalette = ({
  open,
  query,
  selectedIds,
  results,
  activeIndex,
}: CommandPaletteProps): string => `
  <div id="command-palette" class="${open ? '' : 'hidden'}" role="dialog" aria-modal="true" aria-label="Command palette">
    <div class="fixed inset-0 z-40 bg-slate-900/25 backdrop-blur-[2px]" data-action="close-command-palette"></div>
    <div class="fixed inset-x-0 top-[10vh] z-50 mx-auto w-[92%] max-w-2xl">
      <section class="panel p-3">
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
            class="focus-ring h-11 w-full rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel-surface)] pl-10 pr-4 text-sm text-[color:var(--text-strong)] placeholder:text-[color:var(--text-muted)]"
            aria-label="Command palette search input"
          />
        </label>

        <ul class="mt-3 max-h-[55vh] space-y-1 overflow-y-auto" aria-label="Command palette results">
          ${
            results.length === 0
              ? '<li class="rounded-md border border-dashed border-[color:var(--panel-border)] px-3 py-4 text-sm text-[color:var(--text-muted)]">No matching apps.</li>'
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
                          class="focus-ring flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm ${
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
      </section>
    </div>
  </div>
`
