export type AppRoute =
  | { kind: 'home' }
  | { kind: 'generate' }
  | { kind: 'share'; token: string | null }
  | { kind: 'not-found'; path: string }

const normalizeHash = (rawHash: string): string => {
  if (!rawHash || rawHash === '#') {
    return '/'
  }

  const trimmed = rawHash.startsWith('#') ? rawHash.slice(1) : rawHash
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

export const parseRoute = (rawHash: string = window.location.hash): AppRoute => {
  const path = normalizeHash(rawHash)

  if (path === '/') {
    return { kind: 'home' }
  }

  if (path === '/generate') {
    return { kind: 'generate' }
  }

  if (path === '/about') {
    return { kind: 'home' }
  }

  if (path === '/share') {
    return { kind: 'share', token: null }
  }

  if (path.startsWith('/share/')) {
    let token: string
    try {
      token = decodeURIComponent(path.slice('/share/'.length))
    } catch {
      token = path.slice('/share/'.length)
    }
    if (token.length > 0) {
      return { kind: 'share', token }
    }
  }

  return { kind: 'not-found', path }
}

export const initRouter = (onRoute: (route: AppRoute) => void): (() => void) => {
  const handleRoute = (): void => {
    onRoute(parseRoute())
  }

  window.addEventListener('hashchange', handleRoute)
  handleRoute()

  return () => window.removeEventListener('hashchange', handleRoute)
}
