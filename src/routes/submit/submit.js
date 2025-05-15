import { statusCodes } from '../../common/constants/status-codes.js'
import {
  sendEmailToApplicant,
  sendEmailToCaseWorker
} from '../../common/connectors/notify/notify.js'
import { getApplicationReference } from '../../common/helpers/application-reference/index.js'
import { getQuestionFromSections } from '../../common/helpers/data-extract/data-extract.js'
import { generateEmailContent } from '../../common/helpers/email-content/email-content.js'
import { isValidPayload, isValidRequest } from './submit-validation.js'

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

      await sendEmailToCaseWorker({ content: caseWorkerEmailContent })
      await sendEmailToApplicant({
        email: applicantEmail ?? '',
        fullName: applicantFullName ?? '',
        reference: reference ?? ''
      })
      return h.response({ message: reference }).code(statusCodes.ok)
    }
  }
]
