import { ClipboardList, Link2, Trash2, createElement } from 'lucide'
import type { IconNode } from 'lucide'
import type { CatalogApp } from '../../data/schema'

interface CartPanelProps {
  selectedApps: CatalogApp[]
  placement: 'desktop' | 'mobile'
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

const groupByCategory = (apps: CatalogApp[]): Map<string, CatalogApp[]> => {
  const grouped = new Map<string, CatalogApp[]>()

  for (const app of apps) {
    const existing = grouped.get(app.category)
    if (existing) {
      existing.push(app)
      continue
    }
    grouped.set(app.category, [app])
  }

  return new Map(
    [...grouped.entries()].sort((left, right) => left[0].localeCompare(right[0])),
  )
}

export const renderCartPanel = ({
  selectedApps,
  placement,
}: CartPanelProps): string => {
  const grouped = groupByCategory(selectedApps)

  return `
    <section class="panel">
      <div class="flex items-center justify-between gap-2">
        <h2 class="panel-title">Selection Cart</h2>
        <span class="chip">${selectedApps.length} selected</span>
      </div>

      <p class="mt-2 text-xs text-[color:var(--text-subtle)]">
        Review scripts before running. This website does not execute installers.
      </p>

      ${
        selectedApps.length === 0
          ? `
            <div class="mt-4 rounded-xl border border-dashed border-[color:var(--panel-border)] bg-[color:var(--panel-soft)] px-4 py-5 text-sm text-[color:var(--text-muted)]">
              Your cart is empty. Add apps from the catalog.
            </div>
          `
          : `
            <div class="mt-4 max-h-[260px] space-y-3 overflow-y-auto pr-1">
              ${[...grouped.entries()]
                .map(
                  ([category, apps]) => `
                    <div class="rounded-xl border border-[color:var(--panel-border)] px-3 py-2">
                      <div class="flex items-center justify-between text-xs uppercase tracking-[0.12em] text-[color:var(--text-subtle)]">
                        <span>${escapeHtml(category)}</span>
                        <span>${apps.length}</span>
                      </div>
                      <ul class="mt-2 space-y-1">
                        ${apps
                          .map(
                            (app) => `
                              <li class="truncate text-sm text-[color:var(--text-strong)]" title="${escapeHtml(app.name)}">
                                ${escapeHtml(app.name)}
                              </li>
                            `,
                          )
                          .join('')}
                      </ul>
                    </div>
                  `,
                )
                .join('')}
            </div>
          `
      }

      <div class="mt-5 grid gap-2">
        <a href="#/generate" class="btn-primary w-full justify-center">
          ${iconToSvg(ClipboardList, 'h-4 w-4')}
          Go to Generate
        </a>
        <button type="button" data-action="copy-share-link" class="btn-ghost w-full justify-center">
          ${iconToSvg(Link2, 'h-4 w-4')}
          Create Share Link
        </button>
        <button
          type="button"
          data-action="clear-selection"
          class="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
        >
          ${iconToSvg(Trash2, 'h-4 w-4')}
          Clear All
        </button>
      </div>

      ${
        placement === 'mobile'
          ? `<p class="mt-3 text-center text-xs text-[color:var(--text-subtle)]">Mobile drawer</p>`
          : ''
      }
    </section>
  `
}
