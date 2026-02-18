type ToastTone = 'success' | 'error' | 'info'

const CONTAINER_ID = 'toast-stack'

const toneClassMap: Record<ToastTone, string> = {
  success:
    'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-200',
  error:
    'border-red-300 bg-red-50 text-red-800 dark:border-red-400/40 dark:bg-red-500/15 dark:text-red-200',
  info: 'border-[color:var(--panel-border)] bg-[color:var(--panel-surface)] text-[color:var(--text-strong)]',
}

const getOrCreateToastContainer = (): HTMLElement => {
  const existing = document.getElementById(CONTAINER_ID)
  if (existing) {
    return existing
  }

  const container = document.createElement('div')
  container.id = CONTAINER_ID
  container.className =
    'pointer-events-none fixed inset-x-0 top-3 z-[70] mx-auto flex w-full max-w-md flex-col gap-2 px-3'
  document.body.appendChild(container)
  return container
}

export const showToast = (
  message: string,
  tone: ToastTone = 'info',
  timeoutMs = 2200,
): void => {
  const container = getOrCreateToastContainer()
  const toast = document.createElement('div')
  toast.className = `pointer-events-auto rounded-xl border px-3 py-2 text-sm shadow-lg backdrop-blur ${toneClassMap[tone]}`
  toast.textContent = message
  container.appendChild(toast)

  window.setTimeout(() => {
    toast.remove()
  }, timeoutMs)
}
