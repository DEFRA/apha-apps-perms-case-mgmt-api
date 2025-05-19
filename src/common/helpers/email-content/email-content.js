import { config } from '../../../config.js'

/** @import {ApplicationData} from '../data-extract/data-extract.js' */

/**
 * @typedef {{file: string, filename: string, confirm_email_before_download: boolean, retention_period: string}} FileProps
 */

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

/**
 * @param {Buffer<ArrayBufferLike>} file
 * @param {string} extension
 * @returns {FileProps}
 */
export const getFileProps = (file, extension) => {
  const { fileRetention, confirmDownloadConfirmation } = config.get('notify')
  return {
    file: file?.toString('base64'),
    filename: `Biosecurity-map.${extension}`,
    confirm_email_before_download: confirmDownloadConfirmation,
    retention_period: fileRetention
  }
}
