import { catalogSchema, type CatalogApp } from './schema'

const catalogUrl = `${import.meta.env.BASE_URL}data/apps.json`

const findDuplicateIds = (apps: CatalogApp[]): string[] => {
  const seen = new Set<string>()
  const duplicates = new Set<string>()

  for (const app of apps) {
    if (seen.has(app.id)) {
      duplicates.add(app.id)
      continue
    }
    seen.add(app.id)
  }

  return [...duplicates]
}

export const loadCatalog = async (): Promise<CatalogApp[]> => {
  const response = await fetch(catalogUrl)
  if (!response.ok) {
    throw new Error(`Catalog request failed with status ${response.status}.`)
  }

  const raw: unknown = await response.json()
  const parsed = catalogSchema.safeParse(raw)
  if (!parsed.success) {
    throw new Error(`Catalog validation failed: ${parsed.error.issues[0]?.message ?? 'Unknown error.'}`)
  }

  const duplicates = findDuplicateIds(parsed.data)
  if (duplicates.length > 0) {
    throw new Error(`Catalog contains duplicate app ids: ${duplicates.join(', ')}`)
  }

  return parsed.data
}
