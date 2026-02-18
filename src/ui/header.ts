import { Anvil, Menu, createElement } from 'lucide'
import type { IconNode } from 'lucide'
import type { AppRoute } from '../router'

export type ThemeMode = 'dark'

const icon = (node: IconNode, className: string): string =>
  (() => {
    const svg = createElement(node)
    svg.setAttribute('class', className)
    svg.setAttribute('aria-hidden', 'true')
    return svg.outerHTML
  })()

const isNavActive = (route: AppRoute, href: string): boolean => {
  if (href === '#/') {
    return route.kind === 'home'
  }
  if (href === '#/generate') {
    return route.kind === 'generate'
  }
  if (href === '#/about') {
    return route.kind === 'about'
  }
  if (href === '#/share') {
    return route.kind === 'share'
  }
  return false
}

const navLink = (label: string, href: string, active: boolean): string => `
  <a
    href="${href}"
    class="hash-link ${active ? 'is-active' : ''}"
    ${active ? 'aria-current="page"' : ''}
  >
    ${label}
  </a>
`

export const getThemePreference = (): ThemeMode => 'dark'

export const applyTheme = (_theme: ThemeMode = 'dark'): void => {
  document.documentElement.classList.add('dark')
}

export const toggleThemeMode = (_theme: ThemeMode): ThemeMode => 'dark'

export const renderHeader = (route: AppRoute): string => `
  <header class="panel">
    <div class="flex items-center gap-3">
      <a
        href="#/"
        class="focus-ring inline-flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[color:var(--panel-soft)]"
        aria-label="AppAnvil home"
      >
        <span class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
          ${icon(Anvil, 'h-5 w-5')}
        </span>
        <span class="hidden sm:block">
          <span class="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-subtle)]">Practical App Setup</span>
          <span class="block text-lg font-semibold leading-tight text-[color:var(--text-strong)]">AppAnvil</span>
        </span>
      </a>

      <span class="chip ml-1 hidden lg:inline-flex">Ctrl/Cmd + K</span>

      <button
        id="mobile-nav-toggle"
        type="button"
        aria-label="Toggle navigation"
        aria-controls="header-nav"
        aria-expanded="false"
        class="focus-ring ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[color:var(--panel-border)] bg-[color:var(--panel-surface)] text-[color:var(--text-strong)] md:hidden"
      >
        ${icon(Menu, 'h-5 w-5')}
      </button>

      <nav
        id="header-nav"
        aria-label="Primary"
        class="mt-3 hidden w-full flex-col gap-1.5 border-t border-[color:var(--panel-border)] pt-2 md:mt-0 md:ml-auto md:flex md:w-auto md:flex-row md:items-center md:gap-1.5 md:border-0 md:pt-0"
      >
        ${navLink('Catalog', '#/', isNavActive(route, '#/'))}
        ${navLink('Generate', '#/generate', isNavActive(route, '#/generate'))}
        ${navLink('Share', '#/share', isNavActive(route, '#/share'))}
        ${navLink('About', '#/about', isNavActive(route, '#/about'))}
      </nav>
    </div>
  </header>
`

export const wireHeader = (): (() => void) => {
  const cleanups: Array<() => void> = []

  const mobileToggle = document.querySelector<HTMLButtonElement>('#mobile-nav-toggle')
  const nav = document.querySelector<HTMLElement>('#header-nav')
  if (mobileToggle && nav) {
    const clickHandler = (): void => {
      const isOpen = !nav.classList.contains('hidden')
      nav.classList.toggle('hidden', isOpen)
      mobileToggle.setAttribute('aria-expanded', String(!isOpen))
    }

    mobileToggle.addEventListener('click', clickHandler)
    cleanups.push(() => mobileToggle.removeEventListener('click', clickHandler))
  }

  return () => {
    cleanups.forEach((cleanup) => cleanup())
  }
}
