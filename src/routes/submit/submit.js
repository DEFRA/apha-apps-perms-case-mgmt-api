import { statusCodes } from '../../common/constants/status-codes.js'
import { isValidPayload, isValidRequest } from './submit-validation.js'
import { createApplication } from '../../common/helpers/data-extract/data-extract.js'
import { TbApplication } from '../../common/helpers/data-extract/tb-application.js'
import { config } from '../../config.js'
import { queueApplication } from '../../common/helpers/queue/queue.js'
import {
  emailApplicationHandler,
  sendApplicantConfirmationEmail
} from '../../common/helpers/email/email.js'
import { stubModeApplicationHandler } from '../../common/helpers/stub-mode/stub-mode.js'

/** @import { Logger} from 'pino' */
/** @import {Application} from '../../common/helpers/data-extract/application.js' */

export const submit = [
  {
    method: 'POST',
    path: '/submit',
    handler: async (request, h) => {
      const featureFlags = config.get('featureFlags')

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

      const application = createApplication(request.payload)
      const reference = application.getNewReference()

      const result = await runHandlers(
        application,
        reference,
        featureFlags,
        request.logger
      )

      // @ts-ignore - result may be void but optional chaining handles it safely
      if (result?.error) {
        return h
          .response({ error: result.error.errorCode })
          .code(result.error.statusCode)
      }

      request.logger.info(
        `Application submitted successfully with reference: ${reference}`
      )

      return h.response({ message: reference }).code(statusCodes.ok)
    }
  }
]

// sharePoint and caseManagement can both run when enabled; email is only the fallback if neither ran
/**
 *
 * @param {Application} application
 * @param {string} reference
 * @param {object} featureFlags
 * @param {Logger} logger
 * @returns
 */
const runHandlers = async (application, reference, featureFlags, logger) => {
  if (featureFlags.stubMode) {
    return stubModeApplicationHandler(application, reference)
  }

  const isTbApplication = application instanceof TbApplication
  const runSharepoint =
    isTbApplication && featureFlags.sharepointIntegrationEnabled
  const runCaseManagement =
    isTbApplication && featureFlags.caseManagementIntegrationEnabled
  const runEmailBackup =
    (runSharepoint || runCaseManagement) && featureFlags.emailBackupEnabled

  if (!runSharepoint && !runCaseManagement) {
    return emailApplicationHandler(application, reference)
  }

  // Sharepoint or Salesforce enabled at this point (and it is a TB application)
  const queueingResult = await queueApplication(application, reference)

  if (queueingResult?.error) {
    logger.error(
      `Queueing failed for reference ${reference}: ${queueingResult.error.errorCode}`
    )
  } else {
    try {
      if (runEmailBackup) {
        return await emailApplicationHandler(application, reference)
      } else {
        return await sendApplicantConfirmationEmail(application, reference)
      }
    } catch (error) {
      logger.error(`Failed to send email to applicant: ${error.message}`)
    }
  }

  return queueingResult
}
