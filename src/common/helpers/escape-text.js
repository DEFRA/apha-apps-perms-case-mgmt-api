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
  Object.keys(data).forEach((key) => {
    if (typeof data[key] === 'string') {
      data[key] = escapeHtml(data[key])
    } else if (typeof data[key] === 'object' && data[key] !== null) {
      data[key] = escapeJsonValues(data[key])
    } else {
      // No action needed for other types
    }
  })
  return data
}
