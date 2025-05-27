import { config } from '../../../config.js'
import { getFileExtension } from '../file/file-utils.js'

/**
 * @import {ApplicationData} from '../data-extract/data-extract.js'
 * @import {FileData} from '../file/file-utils.js'
 */

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
      if (answer.type !== 'file' || answer.value?.skipped) {
        lines.push(answer.displayText)
      }
    })
  })

  return lines.join('\n')
}

/**
 * @param {FileData} fileData
 * @returns {FileProps}
 */
export const getFileProps = (fileData) => {
  const { fileRetention, confirmDownloadConfirmation } = config.get('notify')
  const filename = `Biosecurity-map.${getFileExtension(fileData.contentType)}`
  return {
    file: fileData.file?.toString('base64'),
    filename,
    confirm_email_before_download: confirmDownloadConfirmation,
    retention_period: fileRetention
  }
}
