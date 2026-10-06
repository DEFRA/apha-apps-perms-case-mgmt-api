import { getQuestionFromSections } from '../data-extract/data-extract.js'
import { generateHtmlBuffer } from '../export/export-html.js'
import {
  getListItemByFieldValue,
  getListItemUrl,
  uploadFile
} from '../../../common/connectors/sharepoint/sharepoint.js'
import { statusCodes } from '../../constants/status-codes.js'
import { generateSharepointNotificationContent } from '../email-content/email-content.js'
import { fetchFile, getFileExtension } from '../file/file-utils.js'
import { sendEmailToCaseWorker } from '../../connectors/notify/notify.js'
import {
  createSharepointItem,
  validateKeyFactsPayload
} from './sharepoint-item.js'
import { createLogger } from '../logging/logger.js'
import { config } from '../../../config.js'

/**
 * @import {FileAnswer} from '../../../common/helpers/data-extract/application.js'
 * @import {HandlerError} from '../../../common/helpers/types.js'
 * @import {Application} from '../../../common/helpers/data-extract/application.js'
 */

const logger = createLogger()

/**
 * @param {Application} application
 * @param {string} reference
 * @returns {Promise<void|HandlerError>}
 */
export const processApplication = async (application, reference) => {
  validateKeyFactsPayload(application, reference)
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
 * @param {Application} application
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
 * @param {Application} application
 * @param {string} reference
 * @returns {Promise<void>}
 */
const uploadBiosecurityMap = async (application, reference) => {
  const fileAnswer = /** @type {FileAnswer} */ (
    getQuestionFromSections(
      'upload-plan',
      'biosecurity-map',
      application.sections
    )?.answer
  )

  if (fileAnswer && !fileAnswer.value?.skipped) {
    const fileData = await fetchFile(fileAnswer)
    const filename = `${reference}_Biosecurity_Map.${getFileExtension(fileData.contentType)}`
    return uploadFile(reference, filename, fileData.file)
  }
  return undefined // No file to upload, resolve immediately
}

/**
 * @param {Application} application
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
