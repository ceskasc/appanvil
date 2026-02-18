import { Download, createElement } from 'lucide'
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
    <section class="panel space-y-3">
      <div class="flex items-center justify-between gap-2">
        <h2 class="panel-title">Your Selection</h2>
        <span class="chip">${selectedApps.length} selected</span>
      </div>

      <p class="text-xs text-[color:var(--text-subtle)]">
        Native EXE download is coming soon. Profile export is temporarily disabled.
      </p>

      ${
        selectedApps.length === 0
          ? `
            <div class="rounded-md border border-dashed border-[color:var(--panel-border)] bg-[color:var(--panel-soft)] px-3 py-3 text-sm text-[color:var(--text-muted)]">
              No apps selected yet. Pick apps to build your install profile.
            </div>
          `
          : `
            <div class="max-h-[300px] space-y-2 overflow-y-auto pr-1">
              ${[...grouped.entries()]
                .map(
                  ([category, apps]) => `
                    <div class="rounded-md border border-[color:var(--panel-border)] bg-[color:var(--panel-soft)] px-3 py-2">
                      <div class="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-[color:var(--text-subtle)]">
                        <span>${escapeHtml(category)}</span>
                        <span>${apps.length}</span>
                      </div>
                      <ul class="mt-1 space-y-1">
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

      <div class="grid gap-2">
        <button
          type="button"
          disabled
          class="btn-primary w-full justify-center pointer-events-none opacity-60"
        >
          ${iconToSvg(Download, 'h-4 w-4')}
          Download Coming Soon
        </button>
      </div>

      ${
        placement === 'mobile'
          ? '<p class="text-center text-[11px] uppercase tracking-[0.14em] text-[color:var(--text-subtle)]">Mobile drawer</p>'
          : ''
      }
    </section>
  `
}
