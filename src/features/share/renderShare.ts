interface ShareStatus {
  tone: 'idle' | 'success' | 'error'
  message: string
}

interface RenderShareViewProps {
  routeToken: string | null
  status: ShareStatus
  currentShareUrl: string | null
  selectedCount: number
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

const statusClassName = (tone: ShareStatus['tone']): string => {
  if (tone === 'success') {
    return 'border-emerald-400/40 bg-emerald-500/15 text-emerald-200'
  }
  if (tone === 'error') {
    return 'border-red-400/40 bg-red-500/15 text-red-200'
  }
  return 'border-[color:var(--panel-border)] bg-[color:var(--panel-soft)] text-[color:var(--text-muted)]'
}

export const renderShareView = ({
  routeToken,
  status,
  currentShareUrl,
  selectedCount,
}: RenderShareViewProps): string => `
  <section class="space-y-5">
    <div class="panel max-w-5xl">
      <h1 class="text-2xl font-bold tracking-tight text-[color:var(--text-strong)]">5) Paylas ve Ice Aktar</h1>
      <p class="mt-2 text-sm text-[color:var(--text-muted)]">
        Bu sayfada secimini baskasina link olarak gonderebilir veya gelen link/JSON ile ayni secimi geri yukleyebilirsin.
      </p>
      <p class="mt-1 text-xs text-[color:var(--text-subtle)]">
        Mevcut secim: ${selectedCount} program
      </p>
    </div>

    <div class="grid gap-5 xl:grid-cols-2">
      <section class="panel">
        <h2 class="panel-title">Link Durumu</h2>
        ${
          routeToken
            ? `<p class="mt-2 break-all rounded-xl border border-dashed border-[color:var(--panel-border)] bg-[color:var(--panel-soft)] px-3 py-2 font-mono text-xs text-[color:var(--text-strong)]">${escapeHtml(routeToken)}</p>`
            : '<p class="mt-2 text-sm text-[color:var(--text-muted)]">URL icinde token yok.</p>'
        }
        <div class="mt-3 rounded-xl border px-3 py-2 text-sm ${statusClassName(status.tone)}">
          ${escapeHtml(status.message)}
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-title">Paylasim Linki Olustur</h2>
        ${
          currentShareUrl
            ? `
              <p class="mt-2 text-sm text-[color:var(--text-muted)]">Asagidaki URL'yi kopyalayip paylasabilirsin.</p>
              <p class="mt-2 break-all rounded-xl border border-dashed border-[color:var(--panel-border)] bg-[color:var(--panel-soft)] px-3 py-2 text-xs text-[color:var(--text-strong)]">${escapeHtml(currentShareUrl)}</p>
              <button type="button" data-action="copy-current-share-url" class="btn-primary mt-3">
                Linki Kopyala
              </button>
            `
            : '<p class="mt-2 text-sm text-[color:var(--text-muted)]">Paylasim linki icin en az bir program secmelisin.</p>'
        }
      </section>

      <section class="panel">
        <h2 class="panel-title">Token veya URL ile Ice Aktar</h2>
        <label for="share-import-input" class="mt-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-subtle)]">
          Token veya tam URL yapistir
        </label>
        <textarea
          id="share-import-input"
          data-share-import-input
          rows="4"
          placeholder="https://username.github.io/appanvil/#/share/<token>"
          class="focus-ring mt-2 w-full rounded-xl border border-[color:var(--panel-border)] bg-[color:var(--panel-surface)] px-3 py-2 text-sm text-[color:var(--text-strong)] placeholder:text-[color:var(--text-subtle)]"
          aria-label="Paste share token or URL"
        ></textarea>
        <button type="button" data-action="import-share-text" class="btn-primary mt-3">
          Ice Aktar
        </button>
      </section>

      <section class="panel">
        <h2 class="panel-title">JSON Dosyasi ile Ice Aktar</h2>
        <p class="mt-2 text-sm text-[color:var(--text-muted)]">
          AppAnvil'den indirdigin secim JSON dosyasini yukle.
        </p>
        <label
          for="share-json-file"
          class="focus-ring mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[color:var(--panel-border)] bg-[color:var(--panel-surface)] px-4 py-2.5 text-sm font-medium text-[color:var(--text-strong)] hover:bg-[color:var(--panel-soft)]"
        >
          JSON Dosyasi Sec
        </label>
        <input
          id="share-json-file"
          data-share-json-file
          type="file"
          accept=".json,application/json"
          class="sr-only"
          aria-label="Upload selection JSON file"
        />
      </section>
    </div>
  </section>
`
