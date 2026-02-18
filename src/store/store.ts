import type { CatalogApp, ProviderKey } from '../data/schema'
import {
  DEFAULT_FILTERS,
  type CatalogFilters,
  type SortMode,
} from '../features/catalog/filters'
import {
  DEFAULT_GENERATOR_OPTIONS,
  type GenerateTab,
  type GeneratorOptions,
} from '../features/generator/generator'
import {
  loadPersistedState,
  savePersistedState,
  type PersistedState,
} from './persist'

export type CatalogStatus = 'loading' | 'ready' | 'error'

export interface AppState {
  catalog: CatalogApp[]
  catalogStatus: CatalogStatus
  catalogError: string | null
  selectedIds: string[]
  filters: CatalogFilters
  generatorOptions: GeneratorOptions
  generateActiveTab: GenerateTab
  commandPaletteOpen: boolean
  commandPaletteQuery: string
  commandPaletteIndex: number
}

type Listener = (state: AppState) => void
type Updater = (state: AppState) => AppState

const INITIAL_PERSISTED: PersistedState = {
  selectedIds: [],
  filters: DEFAULT_FILTERS,
  generatorOptions: DEFAULT_GENERATOR_OPTIONS,
}

const createInitialState = (): AppState => {
  const persisted = loadPersistedState() ?? INITIAL_PERSISTED

  return {
    catalog: [],
    catalogStatus: 'loading',
    catalogError: null,
    selectedIds: persisted.selectedIds,
    filters: persisted.filters,
    generatorOptions: persisted.generatorOptions,
    generateActiveTab: 'ps1',
    commandPaletteOpen: false,
    commandPaletteQuery: '',
    commandPaletteIndex: 0,
  }
}

const normalizePaletteIndex = (index: number): number =>
  Number.isInteger(index) && index >= 0 ? index : 0

const normalizeGeneratorOptions = (
  options: GeneratorOptions,
): GeneratorOptions => ({
  silentInstall: options.silentInstall,
  continueOnError: options.continueOnError,
  includeMsStoreApps: options.includeMsStoreApps,
})

export const createStore = () => {
  let state = createInitialState()
  const listeners = new Set<Listener>()

  const emit = (): void => {
    listeners.forEach((listener) => listener(state))
  }

  const persistIfNeeded = (previous: AppState, next: AppState): void => {
    if (
      previous.selectedIds !== next.selectedIds ||
      previous.filters !== next.filters ||
      previous.generatorOptions !== next.generatorOptions
    ) {
      savePersistedState({
        selectedIds: next.selectedIds,
        filters: next.filters,
        generatorOptions: next.generatorOptions,
      })
    }
  }

  const setState = (updater: Updater): void => {
    const previous = state
    const next = updater(previous)
    state = next
    persistIfNeeded(previous, next)
    emit()
  }

  return {
    getState: (): AppState => state,

    subscribe: (listener: Listener): (() => void) => {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    setCatalog: (catalog: CatalogApp[]): void => {
      const validIds = new Set(catalog.map((app) => app.id))
      setState((previous) => ({
        ...previous,
        catalog,
        catalogStatus: 'ready',
        catalogError: null,
        selectedIds: previous.selectedIds.filter((id) => validIds.has(id)),
      }))
    },

    setCatalogError: (error: string): void => {
      setState((previous) => ({
        ...previous,
        catalogStatus: 'error',
        catalogError: error,
      }))
    },

    toggleSelectedApp: (appId: string): void => {
      setState((previous) => {
        const selected = new Set(previous.selectedIds)
        if (selected.has(appId)) {
          selected.delete(appId)
        } else {
          selected.add(appId)
        }
        return {
          ...previous,
          selectedIds: [...selected],
        }
      })
    },

    clearSelectedApps: (): void => {
      setState((previous) => ({
        ...previous,
        selectedIds: [],
      }))
    },

    setFilterQuery: (query: string): void => {
      setState((previous) => ({
        ...previous,
        filters: {
          ...previous.filters,
          query,
        },
      }))
    },

    toggleCategory: (category: string): void => {
      setState((previous) => {
        const categories = new Set(previous.filters.categories)
        if (categories.has(category)) {
          categories.delete(category)
        } else {
          categories.add(category)
        }
        return {
          ...previous,
          filters: {
            ...previous.filters,
            categories: [...categories].sort((left, right) =>
              left.localeCompare(right),
            ),
          },
        }
      })
    },

    setProviderFilter: (provider: ProviderKey, enabled: boolean): void => {
      setState((previous) => ({
        ...previous,
        filters: {
          ...previous.filters,
          providers: {
            ...previous.filters.providers,
            [provider]: enabled,
          },
        },
      }))
    },

    setPopularOnly: (enabled: boolean): void => {
      setState((previous) => ({
        ...previous,
        filters: {
          ...previous.filters,
          popularOnly: enabled,
        },
      }))
    },

    setSortMode: (sort: SortMode): void => {
      setState((previous) => ({
        ...previous,
        filters: {
          ...previous.filters,
          sort,
        },
      }))
    },

    resetFilters: (): void => {
      setState((previous) => ({
        ...previous,
        filters: DEFAULT_FILTERS,
      }))
    },

    setGeneratorOption: (
      key: keyof GeneratorOptions,
      value: boolean,
    ): void => {
      setState((previous) => ({
        ...previous,
        generatorOptions: {
          ...previous.generatorOptions,
          [key]: value,
        },
      }))
    },

    setGenerateActiveTab: (tab: GenerateTab): void => {
      setState((previous) => ({
        ...previous,
        generateActiveTab: tab,
      }))
    },

    importSelection: (
      selectedIds: string[],
      options: GeneratorOptions,
    ): void => {
      setState((previous) => {
        const normalizedIds = [...new Set(selectedIds)]
        const validIds =
          previous.catalog.length > 0
            ? normalizedIds.filter((id) =>
                previous.catalog.some((catalogApp) => catalogApp.id === id),
              )
            : normalizedIds

        return {
          ...previous,
          selectedIds: validIds,
          generatorOptions: normalizeGeneratorOptions(options),
          generateActiveTab: 'ps1',
        }
      })
    },

    setCommandPaletteOpen: (open: boolean): void => {
      setState((previous) => ({
        ...previous,
        commandPaletteOpen: open,
        commandPaletteIndex: 0,
        commandPaletteQuery: open ? previous.commandPaletteQuery : '',
      }))
    },

    setCommandPaletteQuery: (query: string): void => {
      setState((previous) => ({
        ...previous,
        commandPaletteQuery: query,
        commandPaletteIndex: 0,
      }))
    },

    setCommandPaletteIndex: (index: number): void => {
      setState((previous) => ({
        ...previous,
        commandPaletteIndex: normalizePaletteIndex(index),
      }))
    },

    closeCommandPalette: (): void => {
      setState((previous) => ({
        ...previous,
        commandPaletteOpen: false,
        commandPaletteQuery: '',
        commandPaletteIndex: 0,
      }))
    },
  }
}

export type AppStore = ReturnType<typeof createStore>
