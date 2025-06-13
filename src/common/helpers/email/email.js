import {
  compressFile,
  fetchFile
} from '../../../common/helpers/file/file-utils.js'
import { getQuestionFromSections } from '../../../common/helpers/data-extract/data-extract.js'
import {
  generateEmailContent,
  getFileProps
} from '../../../common/helpers/email-content/email-content.js'
import {
  sendEmailToApplicant,
  sendEmailToCaseWorker
} from '../../../common/connectors/notify/notify.js'
import { statusCodes } from '../../constants/status-codes.js'

/**
 * @import {FileAnswer} from '../../../common/helpers/data-extract/data-extract.js'
 * @import {HandlerError} from '../../../common/helpers/types.js'
 */

/**
 * @param {object} request
 * @param {string} reference
 * @returns {Promise<void|HandlerError>}
 */
export const emailApplicationHandler = async (request, reference) => {
  // Upload the biosecurity map if it exists
  let linkToFile = null
  const fileAnswer = /** @type {FileAnswer} */ (
    getQuestionFromSections(
      'upload-plan',
      'biosecurity-map',
      request.payload?.sections
    )?.answer
  )

  if (fileAnswer && !fileAnswer.value?.skipped) {
    const fileData = await fetchFile(fileAnswer, request)

    if (fileData.fileSizeInMB > 10) {
      return {
        error: {
          errorCode: 'FILE_TOO_LARGE',
          statusCode: statusCodes.contentTooLarge
        }
      }
    }

    let compressedFileData = null

    if (fileData.fileSizeInMB > 2) {
      compressedFileData = await compressFile(fileData, request)

      if (compressedFileData.fileSizeInMB > 2) {
        return {
          error: {
            errorCode: 'FILE_CANNOT_BE_DELIVERED',
            statusCode: statusCodes.contentTooLarge
          }
        }
      }
    }

    linkToFile = getFileProps(compressedFileData ?? fileData)
  }

  await sendEmails(request, reference, linkToFile)
  return undefined
}

const sendEmails = async (request, reference, linkToFile) => {
  // Send emails to case worker and applicant
  const applicantEmail = getQuestionFromSections(
    'emailAddress',
    'licence',
    request.payload?.sections
  )?.answer.displayText
  const applicantFullName = getQuestionFromSections(
    'fullName',
    'licence',
    request.payload?.sections
  )?.answer.displayText

  const caseWorkerEmailContent = generateEmailContent(
    request.payload,
    reference
  )

  await sendEmailToCaseWorker({
    content: caseWorkerEmailContent,
    ...(linkToFile ? { link_to_file: linkToFile } : {})
  })
  await sendEmailToApplicant({
    email: applicantEmail ?? '',
    fullName: applicantFullName ?? '',
    reference: reference ?? ''
  })
}
