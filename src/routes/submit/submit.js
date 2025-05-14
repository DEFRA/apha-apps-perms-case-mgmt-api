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
        return h.response({ error: 'Invalid request' }).code(400)
      }
      if (!isValidPayload(request)) {
        return h.response({ error: 'Invalid payload' }).code(400)
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
      return h.response({ message: reference }).code(201)
    }
  }
]
