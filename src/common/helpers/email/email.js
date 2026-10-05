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
import { escapeMarkdown } from '../escape-text.js'
import { getApplicantDetails } from '../applicant-details.js'

/**
 * @import {FileAnswer, Application} from '../../../common/helpers/data-extract/application.js'
 * @import {HandlerError} from '../../../common/helpers/types.js'
 */

/**
 * @param {Application} application
 * @param {string} reference
 * @returns {Promise<void|HandlerError>}
 */
export const emailApplicationHandler = async (application, reference) => {
  // Upload the biosecurity map if it exists
  let linkToFile = null
  const fileAnswer = /** @type {FileAnswer} */ (
    getQuestionFromSections(
      'upload-plan',
      'biosecurity-map',
      application.sections
    )?.answer
  )

  if (fileAnswer && !fileAnswer.value?.skipped) {
    const fileData = await fetchFile(fileAnswer)

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
      compressedFileData = await compressFile(fileData, application)

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

  await sendEmails(application, reference, linkToFile)
  return undefined
}

/**
 * @param {Application} application
 * @param {string} reference
 * @returns {Promise<void>}
 */
export const sendApplicantConfirmationEmail = async (
  application,
  reference
) => {
  const { emailAddress: applicantEmail, fullName: applicantFullName } =
    getApplicantDetails(application)

  await sendEmailToApplicant(
    {
      email: applicantEmail,
      fullName: escapeMarkdown(applicantFullName) ?? '',
      reference: reference ?? ''
    },
    application.emailConfig.applicantConfirmation
  )
}

const sendEmails = async (application, reference, linkToFile) => {
  const caseWorkerEmailContent = generateEmailContent(application, reference)

  await sendEmailToCaseWorker(
    {
      content: escapeMarkdown(caseWorkerEmailContent),
      ...(linkToFile ? { link_to_file: linkToFile } : {})
    },
    application.emailConfig.caseDelivery
  )

  await sendApplicantConfirmationEmail(application, reference)
}
