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
    return 'border-emerald-300 bg-emerald-50 text-emerald-800'
  }
  if (tone === 'error') {
    return 'border-red-300 bg-red-50 text-red-800'
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
      <h1 class="text-2xl font-bold tracking-tight text-[color:var(--text-strong)]">Share and Import</h1>
      <p class="mt-2 text-sm text-[color:var(--text-muted)]">
        Share tokens include selected app IDs and generator options. Invalid tokens are safely rejected.
      </p>
      <p class="mt-1 text-xs text-[color:var(--text-subtle)]">
        Current selection: ${selectedCount} app(s)
      </p>
    </div>

    <div class="grid gap-5 xl:grid-cols-2">
      <section class="panel">
        <h2 class="panel-title">Route Token Status</h2>
        ${
          routeToken
            ? `<p class="mt-2 break-all rounded-xl border border-dashed border-[color:var(--panel-border)] bg-[color:var(--panel-soft)] px-3 py-2 font-mono text-xs text-[color:var(--text-strong)]">${escapeHtml(routeToken)}</p>`
            : '<p class="mt-2 text-sm text-[color:var(--text-muted)]">No route token in URL.</p>'
        }
        <div class="mt-3 rounded-xl border px-3 py-2 text-sm ${statusClassName(status.tone)}">
          ${escapeHtml(status.message)}
        </div>
      </section>

      <section class="panel">
        <h2 class="panel-title">Create Share Link</h2>
        ${
          currentShareUrl
            ? `
              <p class="mt-2 text-sm text-[color:var(--text-muted)]">Copy this URL to share your current selection.</p>
              <p class="mt-2 break-all rounded-xl border border-dashed border-[color:var(--panel-border)] bg-[color:var(--panel-soft)] px-3 py-2 text-xs text-[color:var(--text-strong)]">${escapeHtml(currentShareUrl)}</p>
              <button type="button" data-action="copy-current-share-url" class="btn-primary mt-3">
                Copy Current Share URL
              </button>
            `
            : '<p class="mt-2 text-sm text-[color:var(--text-muted)]">Select at least one app to generate a share URL.</p>'
        }
      </section>

      <section class="panel">
        <h2 class="panel-title">Import via Token or URL</h2>
        <label for="share-import-input" class="mt-2 block text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--text-subtle)]">
          Paste token or full URL
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
          Import from Token/URL
        </button>
      </section>

      <section class="panel">
        <h2 class="panel-title">Import JSON File</h2>
        <p class="mt-2 text-sm text-[color:var(--text-muted)]">
          Upload selection JSON exported from AppAnvil.
        </p>
        <label
          for="share-json-file"
          class="focus-ring mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[color:var(--panel-border)] bg-[color:var(--panel-surface)] px-4 py-2.5 text-sm font-medium text-[color:var(--text-strong)] hover:bg-[color:var(--panel-soft)]"
        >
          Choose JSON File
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
