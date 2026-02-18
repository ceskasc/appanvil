export interface TabDefinition<T extends string> {
  id: T
  label: string
}

export const resolveActiveTab = <T extends string>(
  requestedTab: T,
  availableTabs: T[],
): T => {
  if (availableTabs.includes(requestedTab)) {
    return requestedTab
  }

  return availableTabs[0]
}
