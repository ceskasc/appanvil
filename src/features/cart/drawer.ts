type Cleanup = () => void

const setDrawerOpen = (drawerId: string, open: boolean): void => {
  const drawer = document.getElementById(drawerId)
  if (!drawer) {
    return
  }
  drawer.classList.toggle('hidden', !open)
}

const closeAllDrawers = (): void => {
  document
    .querySelectorAll<HTMLElement>('[data-drawer-id]')
    .forEach((drawer) => drawer.classList.add('hidden'))
}

export const wireDrawerControls = (): Cleanup => {
  const cleanups: Cleanup[] = []

  document
    .querySelectorAll<HTMLButtonElement>('[data-open-drawer]')
    .forEach((button) => {
      const drawerId = button.dataset.openDrawer
      if (!drawerId) {
        return
      }

      const onClick = (): void => setDrawerOpen(drawerId, true)
      button.addEventListener('click', onClick)
      cleanups.push(() => button.removeEventListener('click', onClick))
    })

  document
    .querySelectorAll<HTMLButtonElement>('[data-close-drawer]')
    .forEach((button) => {
      const drawerId = button.dataset.closeDrawer
      if (!drawerId) {
        return
      }

      const onClick = (): void => setDrawerOpen(drawerId, false)
      button.addEventListener('click', onClick)
      cleanups.push(() => button.removeEventListener('click', onClick))
    })

  const onEscape = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      closeAllDrawers()
    }
  }

  document.addEventListener('keydown', onEscape)
  cleanups.push(() => document.removeEventListener('keydown', onEscape))

  return () => {
    cleanups.forEach((cleanup) => cleanup())
  }
}
