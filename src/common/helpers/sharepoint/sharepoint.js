import { getQuestionFromSections } from '../data-extract/data-extract.js'
import { generateHtmlBuffer } from '../export/export-html.js'
import {
  getListItemUrl,
  uploadFile
} from '../../../common/connectors/sharepoint/sharepoint.js'
import { statusCodes } from '../../constants/status-codes.js'
import {
  generateSharepointNotifiationContent,
  getFileProps
} from '../email-content/email-content.js'
import { fetchFile } from '../file/file-utils.js'
import {
  sendEmailToApplicant,
  sendEmailToCaseWorker
} from '../../connectors/notify/notify.js'
import { escapeMarkdown } from '../escape-text.js'
import { createSharepointItem } from './sharepoint-item.js'

/**
 * @import {FileAnswer, ApplicationData} from '../../../common/helpers/data-extract/data-extract.js'
 * @import {HandlerError} from '../../../common/helpers/types.js'
 */

/**
 * @param {object} request
 * @param {string} reference
 * @returns {Promise<void|HandlerError>}
 */
export const sharePointApplicationHandler = async (request, reference) => {
  // Upload the application to SharePoint
  const applicationHtml = await generateHtmlBuffer(request.payload, reference)
  try {
    await uploadFile(
      reference,
      `${reference}_Submitted_Application.html`,
      applicationHtml
    )
  } catch (error) {
    request.logger.warn(`Failed to upload file to SharePoint: ${error.message}`)
    return {
      error: {
        errorCode: 'FILE_UPLOAD_FAILED__APPLICATION',
        statusCode: statusCodes.serverError
      }
    }
  }

  // Upload the biosecurity map if it exists
  const fileAnswer = /** @type {FileAnswer} */ (
    getQuestionFromSections(
      'upload-plan',
      'biosecurity-map',
      request.payload?.sections
    )?.answer
  )

  if (fileAnswer && !fileAnswer.value?.skipped) {
    const fileData = await fetchFile(fileAnswer, request)
    const { filename } = getFileProps(fileData)

    try {
      await uploadFile(reference, filename, fileData.file)
    } catch (error) {
      request.logger.warn(
        `Failed to upload file to SharePoint: ${error.message}`
      )
      return {
        error: {
          errorCode: 'FILE_UPLOAD_FAILED__BIOSECURITY_MAP',
          statusCode: statusCodes.serverError
        }
      }
    }
  }

  await sendApplicantConfirmationEmail(request.payload, reference)
  const item = await createSharepointItem(request.payload, reference)
  await sendCaseworkerNotificationEmail(request.payload, reference, item)

  return undefined
}

/**
 * @param {ApplicationData} application
 * @param {string} reference
 * @param {object} sharePointItem
 * @returns {Promise<void>}
 */
const sendCaseworkerNotificationEmail = async (
  application,
  reference,
  sharePointItem
) => {
  const emailContent = generateSharepointNotifiationContent(
    application,
    reference,
    getListItemUrl(sharePointItem.webUrl, sharePointItem.id)
  )

  await sendEmailToCaseWorker({
    content: escapeMarkdown(emailContent)
  })
}

/**
 * @param {ApplicationData} application
 * @param {string} reference
 * @returns {Promise<void>}
 */
const sendApplicantConfirmationEmail = async (application, reference) => {
  const applicantEmail = getQuestionFromSections(
    'emailAddress',
    'licence',
    application?.sections
  )?.answer.displayText
  const applicantFullName = getQuestionFromSections(
    'fullName',
    'licence',
    application?.sections
  )?.answer.displayText

  await sendEmailToApplicant({
    email: escapeMarkdown(applicantEmail) ?? '',
    fullName: escapeMarkdown(applicantFullName) ?? '',
    reference: reference ?? ''
  })
}
