import { statusCodes } from '../../common/constants/status-codes.js'
import { isValidPayload, isValidRequest } from './submit-validation.js'
import { createApplication } from '../../common/helpers/data-extract/data-extract.js'
import { TbApplication } from '../../common/helpers/data-extract/tb-application.js'
import { config } from '../../config.js'
import { sharePointApplicationHandler } from '../../common/helpers/sharepoint/sharepoint.js'
import { emailApplicationHandler } from '../../common/helpers/email/email.js'
import { stubModeApplicationHandler } from '../../common/helpers/stub-mode/stub-mode.js'
import { caseManagementApplicationHandler } from '../../common/helpers/case-management/case-management.js'

/** @import {HandlerError} from '../../common/helpers/types.js' */

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
        featureFlags,
        request,
        reference
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
const runHandlers = async (application, featureFlags, request, reference) => {
  if (featureFlags.stubMode) {
    return stubModeApplicationHandler(request, reference)
  }

  const isTbApplication = application instanceof TbApplication
  const runSharepoint =
    isTbApplication && featureFlags.sharepointIntegrationEnabled
  const runCaseManagement =
    isTbApplication && featureFlags.caseManagementIntegrationEnabled
  const runSharepointBackup =
    runSharepoint && featureFlags.sharepointBackupEnabled

  if (!runSharepoint && !runCaseManagement) {
    return emailApplicationHandler(request, reference)
  }

  const [sharePointResult, caseManagementResult] = await Promise.all([
    runSharepoint
      ? sharePointApplicationHandler(request, reference)
      : undefined,
    runCaseManagement
      ? caseManagementApplicationHandler(request, reference)
      : undefined,
    runSharepointBackup
      ? emailApplicationHandler(request, reference)
      : undefined
  ])

  for (const [
    integrationName,
    result
  ] of /** @type {[string, void | HandlerError][]} */ ([
    ['sharePoint', sharePointResult],
    ['caseManagement', caseManagementResult]
  ])) {
    if (result?.error) {
      request.logger.error(
        `${integrationName} handler failed for reference ${reference}: ${result.error.errorCode}`
      )
    }
  }

  return sharePointResult?.error ? sharePointResult : caseManagementResult
}
