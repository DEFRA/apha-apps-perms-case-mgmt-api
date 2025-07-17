import {
  createApplication,
  getQuestionFromSections
} from '../data-extract/data-extract.js'
import { generateHtmlBuffer } from '../export/export-html.js'
import {
  getListItemByFieldValue,
  getListItemUrl,
  uploadFile
} from '../../../common/connectors/sharepoint/sharepoint.js'
import { statusCodes } from '../../constants/status-codes.js'
import { generateSharepointNotificationContent } from '../email-content/email-content.js'
import { fetchFile, getFileExtension } from '../file/file-utils.js'
import {
  sendEmailToApplicant,
  sendEmailToCaseWorker
} from '../../connectors/notify/notify.js'
import { escapeMarkdown } from '../escape-text.js'
import { createSharepointItem } from './sharepoint-item.js'
import { sendMessageToSQS } from '../../connectors/queue/sqs-producer.js'
import { createLogger } from '../logging/logger.js'
import { config } from '../../../config.js'

/**
 * @import {FileAnswer, ApplicationData} from '../../../common/helpers/data-extract/application.js'
 * @import {HandlerError} from '../../../common/helpers/types.js'
 * @typedef {{ application: ApplicationData, reference: string }} QueuedApplication
 */

const logger = createLogger()

/**
 * @param {object} request
 * @param {string} reference
 * @returns {Promise<void|HandlerError>}
 */
export const sharePointApplicationHandler = async (request, reference) => {
  console.log('Processing application for SharePoint submission...')
  try {
    await sendMessageToSQS(request.payload, reference)
  } catch (error) {
    return {
      error: {
        errorCode: 'MESSAGE_ENQUEUEING_FAILED',
        statusCode: statusCodes.serverError
      }
    }
  }
  try {
    await sendApplicantConfirmationEmail(request.payload, reference)
  } catch (error) {
    logger.error(`Failed to send email to applicant: ${error.message}`)
  }
  return undefined // No error, return undefined
}

/**
 * @param {QueuedApplication} queuedApplicationData
 * @returns {Promise<void|HandlerError>}
 */
export const processApplication = async (queuedApplicationData) => {
  const { reference, application } = queuedApplicationData

  try {
    await uploadSubmittedApplication(application, reference)
  } catch (error) {
    logger.warn(
      `Failed to upload submitted application to SharePoint: ${error.message}`
    )
    // only throw if the error is not a conflict as that would mean the file was already uploaded
    if (error.statusCode !== statusCodes.conflict) {
      throw error
    }
  }

  try {
    await uploadBiosecurityMap(application, reference)
  } catch (error) {
    logger.warn(
      `Failed to upload biosecurity map to SharePoint: ${error.message}`
    )
    // only throw if the error is not a conflict as that would mean the file was already uploaded
    if (error.statusCode !== statusCodes.conflict) {
      throw error
    }
  }

  let item
  try {
    const listItemResult = await getListItemByFieldValue(
      'Application_x0020_Reference_x002',
      reference
    )
    if (!listItemResult?.value || listItemResult.value.length === 0) {
      item = await createSharepointItem(application, reference)
    } else {
      item = listItemResult.value[0]
      logger.warn(
        `SharePoint item for reference ${reference} already exists, skipping creation.`
      )
    }
  } catch (error) {
    logger.warn(`Failed to create SharePoint item: ${error.message}`)
    throw error
  }
  try {
    await sendCaseworkerNotificationEmail(application, reference, item)
  } catch (error) {
    logger.warn(`Failed to send email to case worker: ${error.message}`)
    throw error
  }
}

/**
 * @param {ApplicationData} application
 * @param {string} reference
 * @returns {Promise<void>}
 */
const uploadSubmittedApplication = async (application, reference) => {
  const applicationHtml = generateHtmlBuffer(application, reference)
  return uploadFile(
    reference,
    `${reference}_Submitted_Application.html`,
    applicationHtml
  )
}

/**
 * @param {ApplicationData} application
 * @param {string} reference
 * @returns {Promise<void>}
 */
const uploadBiosecurityMap = async (application, reference) => {
  const fileAnswer = /** @type {FileAnswer} */ (
    getQuestionFromSections(
      'upload-plan',
      'biosecurity-map',
      application?.sections
    )?.answer
  )

  if (fileAnswer && !fileAnswer.value?.skipped) {
    const fileData = await fetchFile(fileAnswer)
    const filename = `${reference}_Biosecurity_Map.${getFileExtension(fileData.contentType)}`
    return uploadFile(reference, filename, fileData.file)
  }
  return Promise.resolve() // No file to upload, resolve immediately
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
  const emailContent = generateSharepointNotificationContent(
    application,
    reference,
    getListItemUrl(sharePointItem?.webUrl, sharePointItem?.id)
  )

  await sendEmailToCaseWorker(
    {
      content: emailContent // escape markdown is done when generating the content as some parts should not be escaped (urls)
    },
    config.get('notify').tb.caseDelivery
  )
}

/**
 * @param {ApplicationData} application
 * @param {string} reference
 * @returns {Promise<void>}
 */
const sendApplicantConfirmationEmail = async (application, reference) => {
  const app = createApplication(application)
  const applicantEmail = app.emailAddress
  const applicantFullName = app.applicantName

  await sendEmailToApplicant(
    {
      email: applicantEmail ?? '',
      fullName: escapeMarkdown(applicantFullName) ?? '',
      reference: reference ?? ''
    },
    config.get('notify').tb.applicantConfirmation
  )
}
