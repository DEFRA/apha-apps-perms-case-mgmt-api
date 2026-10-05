import { config } from '../../../config.js'
import { getFileExtension } from '../file/file-utils.js'
import { escapeMarkdown } from '../escape-text.js'

/**
 * @import {Application} from '../data-extract/application.js'
 * @import {FileData} from '../file/file-utils.js'
 */

/**
 * @typedef {{file: string, filename: string, confirm_email_before_download: boolean, retention_period: string}} FileProps
 */

/**
 * @param {Application} application
 * @param {string} reference
 * @returns {string}
 */
export const generateEmailContent = (application, reference) => {
  /**
   * @type {string[]}
   */
  const lines = []

  lines.push(`# Application reference`)
  lines.push(reference)

  lines.push('')
  lines.push('---')

  Object.values(application.sections).forEach((section) => {
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
 * @param {Application} application
 * @param {string} reference
 * @param {string} link
 * @returns {string}
 */
export const generateSharepointNotificationContent = (
  application,
  reference,
  link
) => {
  const licenceType = application.licenceType
  const cphOfRequester = escapeMarkdown(application.requesterCph ?? '')

  const section = application.get('licence')
  const yourName = section?.get('yourName')?.answer.displayText
  const fullName = section?.get('fullName')?.answer.displayText
  const nameOfRequester = escapeMarkdown(yourName || fullName || '')

  /**
   * @type {string[]}
   */
  const lines = []

  lines.push(
    `A Bovine TB licence application has been received with the following details:`
  )
  lines.push('## Licence type:')
  lines.push(licenceType?.toString() ?? '')
  lines.push('## CPH of requester:')
  lines.push(cphOfRequester ?? '')
  lines.push('## Name of requester:')
  lines.push(nameOfRequester ?? '')
  lines.push(`## Application reference number:`)
  lines.push(reference)
  lines.push('')
  lines.push('---')
  lines.push(
    `Full details can be found on TB25 with the following link: ${link}`
  )

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
