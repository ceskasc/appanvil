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
    <section class="panel space-y-3">
      <div class="flex items-center justify-between gap-2">
        <h2 class="panel-title">3) Secim Sepeti</h2>
        <span class="chip">${selectedApps.length} secili</span>
      </div>

      <p class="text-xs text-[color:var(--text-subtle)]">
        Once programlari burada kontrol et. Sonra <strong>Generate</strong> ile script uretebilirsin.
      </p>

      ${
        selectedApps.length === 0
          ? `
            <div class="rounded-lg bg-[color:var(--panel-surface)] px-3 py-3 text-sm text-[color:var(--text-muted)]">
              Sepet bos. Ortadaki listeden program sec.
            </div>
          `
          : `
            <div class="max-h-[300px] space-y-2 overflow-y-auto pr-1">
              ${[...grouped.entries()]
                .map(
                  ([category, apps]) => `
                    <div class="rounded-lg bg-[color:var(--panel-surface)] px-3 py-2">
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
        <a href="#/generate" class="btn-primary w-full justify-center">
          ${iconToSvg(ClipboardList, 'h-4 w-4')}
          Generate Sayfasina Git
        </a>

        <button type="button" data-action="copy-share-link" class="btn-ghost w-full justify-center">
          ${iconToSvg(Link2, 'h-4 w-4')}
          Paylasim Linki Olustur
        </button>

        <button
          type="button"
          data-action="clear-selection"
          class="focus-ring inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/45 bg-rose-500/12 px-3.5 py-2 text-sm font-semibold text-rose-300 transition-colors hover:bg-rose-500/18"
        >
          ${iconToSvg(Trash2, 'h-4 w-4')}
          Tumunu Temizle
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
