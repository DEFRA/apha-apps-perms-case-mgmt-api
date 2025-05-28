import { statusCodes } from '../../common/constants/status-codes.js'
import {
  sendEmailToApplicant,
  sendEmailToCaseWorker
} from '../../common/connectors/notify/notify.js'
import { getApplicationReference } from '../../common/helpers/application-reference/application-reference.js'
import { getQuestionFromSections } from '../../common/helpers/data-extract/data-extract.js'
import {
  generateEmailContent,
  getFileProps
} from '../../common/helpers/email-content/email-content.js'
import { isValidPayload, isValidRequest } from './submit-validation.js'
import {
  compressFile,
  fetchFile
} from '../../common/helpers/file/file-utils.js'

/** @import {FileAnswer} from '../../common/helpers/data-extract/data-extract.js' */

export const submit = [
  {
    method: 'POST',
    path: '/submit',
    handler: async (request, h) => {
      if (!isValidRequest(request)) {
        return h
          .response({ error: 'INVALID_REQUEST' })
          .code(statusCodes.badRequest)
      }
      if (!isValidPayload(request)) {
        return h
          .response({ error: 'INVALID_PAYLOAD' })
          .code(statusCodes.badRequest)
      }

      const reference = getApplicationReference()
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
          return h
            .response({ error: 'FILE_TOO_LARGE' })
            .code(statusCodes.contentTooLarge)
        }

        const compressedFileData = await compressFile(fileData, request)

        if (compressedFileData.fileSizeInMB > 2) {
          return h
            .response({ error: 'FILE_CANNOT_BE_DELIVERED' })
            .code(statusCodes.contentTooLarge)
        }

        linkToFile = getFileProps(compressedFileData)
      }

      await sendEmailToCaseWorker({
        content: caseWorkerEmailContent,
        ...(linkToFile ? { link_to_file: linkToFile } : {})
      })
      await sendEmailToApplicant({
        email: applicantEmail ?? '',
        fullName: applicantFullName ?? '',
        reference: reference ?? ''
      })
      return h.response({ message: reference }).code(statusCodes.ok)
    }
  }
]
