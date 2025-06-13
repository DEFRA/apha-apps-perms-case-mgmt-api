export const escapeHtml = (unsafe) => {
  return unsafe
    ?.replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

export const escapeMarkdown = (unsafe) => {
  return unsafe
    ?.replaceAll('\\', '\\\\')
    .replaceAll('`', '\\`')
    .replaceAll('*', '\\*')
    .replaceAll('_', '\\_')
    .replaceAll('{', '\\{')
    .replaceAll('}', '\\}')
    .replaceAll('[', '\\[')
    .replaceAll(']', '\\]')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')
}

export const escapeJsonValues = (data) => {
  if (Array.isArray(data)) {
    return data.map((item) =>
      typeof item === 'object' && item !== null ? escapeJsonValues(item) : item
    )
  }
  const escapedData = {}
  Object.keys(data).forEach((key) => {
    if (typeof data[key] === 'string') {
      escapedData[key] = escapeHtml(data[key])
    } else if (typeof data[key] === 'object' && data[key] !== null) {
      escapedData[key] = escapeJsonValues(data[key])
    } else {
      escapedData[key] = data[key]
    }
  })
  return escapedData
}
