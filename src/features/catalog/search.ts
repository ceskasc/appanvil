import Fuse from 'fuse.js'
import type { IFuseOptions } from 'fuse.js'
import type { CatalogApp } from '../../data/schema'

export type CatalogSearch = Fuse<CatalogApp>

const searchOptions: IFuseOptions<CatalogApp> = {
  includeScore: true,
  shouldSort: true,
  threshold: 0.35,
  ignoreLocation: true,
  minMatchCharLength: 2,
  keys: [
    { name: 'name', weight: 0.5 },
    { name: 'tags', weight: 0.25 },
    { name: 'description', weight: 0.2 },
    { name: 'category', weight: 0.05 },
  ],
}

export const createCatalogSearch = (apps: CatalogApp[]): CatalogSearch =>
  new Fuse(apps, searchOptions)

export const fuzzySearchCatalog = (
  apps: CatalogApp[],
  search: CatalogSearch | null,
  query: string,
): CatalogApp[] => {
  const trimmed = query.trim()
  if (trimmed.length === 0) {
    return apps
  }

  if (!search) {
    const lower = trimmed.toLowerCase()
    return apps.filter(
      (app) =>
        app.name.toLowerCase().includes(lower) ||
        app.description.toLowerCase().includes(lower) ||
        app.tags.some((tag) => tag.toLowerCase().includes(lower)),
    )
  }

  return search.search(trimmed).map((result) => result.item)
}
