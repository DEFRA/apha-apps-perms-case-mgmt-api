/** @import {ApplicationData} from '../data-extract/data-extract.js' */

/**
 * @param {ApplicationData} payload
 * @param {string} reference
 * @returns {string}
 */
export const generateEmailContent = (payload, reference) => {
  /**
   * @type {string[]}
   */
  const lines = []

  lines.push(`# Application reference`)
  lines.push(reference)

  lines.push('')
  lines.push('---')

  Object.values(payload.sections).forEach((section) => {
    lines.push(`# ${section.title}`)
    lines.push('')
    lines.push('---')
    section.questionAnswers.forEach(({ question, answer }) => {
      lines.push(`## ${question}`)
      lines.push(answer.displayText)
    })
  })

  return lines.join('\n')
}
