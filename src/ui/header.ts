import { Anvil, Menu, MoonStar, SunMedium, createElement } from 'lucide'
import type { IconNode } from 'lucide'
import type { AppRoute } from '../router'

export type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'appanvil:theme'

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

export const getThemePreference = (): ThemeMode => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)

    if (saved === 'light' || saved === 'dark') {
      return saved
    }
  } catch {}

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export const applyTheme = (theme: ThemeMode): void => {
  const isDark = theme === 'dark'
  document.documentElement.classList.toggle('dark', isDark)

  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {}
}

export const toggleThemeMode = (theme: ThemeMode): ThemeMode =>
  theme === 'dark' ? 'light' : 'dark'

export const renderHeader = (route: AppRoute, theme: ThemeMode): string => `
  <header class="glass rounded-3xl px-4 py-3 md:px-6 md:py-4">
    <div class="flex items-center gap-3">
      <a
        href="#/"
        class="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-[color:var(--panel-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
        aria-label="AppAnvil home"
      >
        <span class="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[color:var(--accent-soft)] text-[color:var(--accent-strong)]">
          ${icon(Anvil, 'h-5 w-5')}
        </span>
        <span class="hidden sm:block">
          <span class="block text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--text-subtle)]">App Script Builder</span>
          <span class="block text-xl font-bold leading-tight text-[color:var(--text-strong)]">AppAnvil</span>
        </span>
      </a>

      <button
        id="mobile-nav-toggle"
        type="button"
        aria-label="Toggle navigation"
        aria-controls="header-nav"
        aria-expanded="false"
        class="focus-ring ml-auto inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--panel-border)] bg-[color:var(--panel-surface)] text-[color:var(--text-strong)] md:hidden"
      >
        ${icon(Menu, 'h-5 w-5')}
      </button>

      <button
        id="theme-toggle-mobile"
        type="button"
        aria-label="Toggle color theme"
        class="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--panel-border)] bg-[color:var(--panel-surface)] text-[color:var(--text-strong)] transition-transform hover:-translate-y-0.5 md:hidden"
      >
        ${theme === 'dark' ? icon(SunMedium, 'h-5 w-5') : icon(MoonStar, 'h-5 w-5')}
      </button>

      <nav
        id="header-nav"
        aria-label="Primary"
        class="mt-3 hidden w-full flex-col gap-2 md:mt-0 md:ml-auto md:flex md:w-auto md:flex-row md:items-center md:gap-2"
      >
        ${navLink('Home', '#/', isNavActive(route, '#/'))}
        ${navLink('Generate', '#/generate', isNavActive(route, '#/generate'))}
        ${navLink('Share', '#/share', isNavActive(route, '#/share'))}
        ${navLink('About', '#/about', isNavActive(route, '#/about'))}
      </nav>

      <button
        id="theme-toggle"
        type="button"
        aria-label="Toggle color theme"
        class="focus-ring hidden h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--panel-border)] bg-[color:var(--panel-surface)] text-[color:var(--text-strong)] transition-transform hover:-translate-y-0.5 md:inline-flex"
      >
        ${theme === 'dark' ? icon(SunMedium, 'h-5 w-5') : icon(MoonStar, 'h-5 w-5')}
      </button>
    </div>
  </header>
`

export const wireHeader = (onThemeToggle: () => void): (() => void) => {
  const cleanups: Array<() => void> = []

  ;['#theme-toggle', '#theme-toggle-mobile'].forEach((selector) => {
    const themeToggle = document.querySelector<HTMLButtonElement>(selector)
    if (!themeToggle) {
      return
    }

    const clickHandler = (): void => onThemeToggle()
    themeToggle.addEventListener('click', clickHandler)
    cleanups.push(() => themeToggle.removeEventListener('click', clickHandler))
  })

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
