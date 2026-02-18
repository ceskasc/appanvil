import type { CatalogApp, ProviderKey } from '../../data/schema'

export type SortMode = 'popularity' | 'name' | 'recent'

export type ProviderFilters = Record<ProviderKey, boolean>

export interface CatalogFilters {
  query: string
  categories: string[]
  providers: ProviderFilters
  popularOnly: boolean
  sort: SortMode
}

export const DEFAULT_FILTERS: CatalogFilters = {
  query: '',
  categories: [],
  providers: {
    winget: false,
    choco: false,
    scoop: false,
  },
  popularOnly: false,
  sort: 'popularity',
}

export const isPopularApp = (app: CatalogApp): boolean =>
  app.popularity >= 80 || app.tags.includes('popular')

export const extractCategories = (apps: CatalogApp[]): string[] =>
  [...new Set(apps.map((app) => app.category))].sort((left, right) =>
    left.localeCompare(right),
  )

const applyProviderFilter = (
  apps: CatalogApp[],
  providers: ProviderFilters,
): CatalogApp[] => {
  const activeProviders = Object.entries(providers)
    .filter(([, enabled]) => enabled)
    .map(([provider]) => provider as ProviderKey)

  if (activeProviders.length === 0) {
    return apps
  }

  return apps.filter((app) =>
    activeProviders.some((provider) => Boolean(app.providers[provider])),
  )
}

const applyCategoryFilter = (
  apps: CatalogApp[],
  categories: string[],
): CatalogApp[] => {
  if (categories.length === 0) {
    return apps
  }

  const allowed = new Set(categories)
  return apps.filter((app) => allowed.has(app.category))
}

const applySort = (apps: CatalogApp[], sort: SortMode): CatalogApp[] => {
  const sorted = [...apps]

  if (sort === 'name') {
    return sorted.sort((left, right) => left.name.localeCompare(right.name))
  }

  if (sort === 'recent') {
    return sorted.sort((left, right) =>
      right.addedAt.localeCompare(left.addedAt),
    )
  }

  return sorted.sort((left, right) => right.popularity - left.popularity)
}

export const applyCatalogFilters = (
  apps: CatalogApp[],
  filters: CatalogFilters,
): CatalogApp[] => {
  const providerFiltered = applyProviderFilter(apps, filters.providers)
  const categoryFiltered = applyCategoryFilter(
    providerFiltered,
    filters.categories,
  )
  const popularFiltered = filters.popularOnly
    ? categoryFiltered.filter(isPopularApp)
    : categoryFiltered

  return applySort(popularFiltered, filters.sort)
}
