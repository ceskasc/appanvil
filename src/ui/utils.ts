export const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')

export const toSortedUnique = (values: string[]): string[] =>
  [...new Set(values)].sort((left, right) => left.localeCompare(right))
