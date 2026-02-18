import { z } from 'zod'
import {
  DEFAULT_FILTERS,
  type CatalogFilters,
  type SortMode,
} from '../features/catalog/filters'
import {
  DEFAULT_GENERATOR_OPTIONS,
  type GeneratorOptions,
} from '../features/generator/generator'

export interface PersistedState {
  selectedIds: string[]
  filters: CatalogFilters
  generatorOptions: GeneratorOptions
}

const STORAGE_KEY = 'appanvil:state:v2'

const sortModeSchema = z.enum(['popularity', 'name', 'recent'])

const persistedFiltersSchema = z.object({
  query: z.string().default(DEFAULT_FILTERS.query),
  categories: z.array(z.string().min(1)).default(DEFAULT_FILTERS.categories),
  providers: z
    .object({
      winget: z.boolean().default(DEFAULT_FILTERS.providers.winget),
      choco: z.boolean().default(DEFAULT_FILTERS.providers.choco),
      scoop: z.boolean().default(DEFAULT_FILTERS.providers.scoop),
    })
    .default(DEFAULT_FILTERS.providers),
  popularOnly: z.boolean().default(DEFAULT_FILTERS.popularOnly),
  sort: sortModeSchema.default(DEFAULT_FILTERS.sort),
})

const generatorOptionsSchema = z.object({
  silentInstall: z
    .boolean()
    .default(DEFAULT_GENERATOR_OPTIONS.silentInstall),
  continueOnError: z
    .boolean()
    .default(DEFAULT_GENERATOR_OPTIONS.continueOnError),
  includeMsStoreApps: z
    .boolean()
    .default(DEFAULT_GENERATOR_OPTIONS.includeMsStoreApps),
})

const persistedStateSchema = z.object({
  selectedIds: z.array(z.string().min(1)).default([]),
  filters: persistedFiltersSchema.default(DEFAULT_FILTERS),
  generatorOptions: generatorOptionsSchema.default(DEFAULT_GENERATOR_OPTIONS),
})

const normalizeSortMode = (value: SortMode): SortMode => {
  const parsed = sortModeSchema.safeParse(value)
  return parsed.success ? parsed.data : DEFAULT_FILTERS.sort
}

const normalizeFilters = (filters: CatalogFilters): CatalogFilters => ({
  query: filters.query,
  categories: [...new Set(filters.categories)].sort((left, right) =>
    left.localeCompare(right),
  ),
  providers: {
    winget: filters.providers.winget,
    choco: filters.providers.choco,
    scoop: filters.providers.scoop,
  },
  popularOnly: filters.popularOnly,
  sort: normalizeSortMode(filters.sort),
})

const normalizeGeneratorOptions = (
  options: GeneratorOptions,
): GeneratorOptions => ({
  silentInstall: options.silentInstall,
  continueOnError: options.continueOnError,
  includeMsStoreApps: options.includeMsStoreApps,
})

export const loadPersistedState = (): PersistedState => {
  const defaults: PersistedState = {
    selectedIds: [],
    filters: DEFAULT_FILTERS,
    generatorOptions: DEFAULT_GENERATOR_OPTIONS,
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaults
    }

    const parsedJson: unknown = JSON.parse(raw)
    const parsed = persistedStateSchema.safeParse(parsedJson)
    if (!parsed.success) {
      return defaults
    }

    return {
      selectedIds: [...new Set(parsed.data.selectedIds)],
      filters: normalizeFilters(parsed.data.filters),
      generatorOptions: normalizeGeneratorOptions(parsed.data.generatorOptions),
    }
  } catch {
    return defaults
  }
}

export const savePersistedState = (state: PersistedState): void => {
  try {
    const payload: PersistedState = {
      selectedIds: [...new Set(state.selectedIds)],
      filters: normalizeFilters(state.filters),
      generatorOptions: normalizeGeneratorOptions(state.generatorOptions),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Ignore storage failures to keep the app usable in private mode or locked contexts.
  }
}
