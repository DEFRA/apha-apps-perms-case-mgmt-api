import { statusCodes } from '../../common/constants/status-codes.js'

import { isValidPayload, isValidRequest } from './submit-validation.js'
import { createApplication } from '../../common/helpers/data-extract/data-extract.js'
import { TbApplication } from '../../common/helpers/data-extract/tb-application.js'

import { config } from '../../config.js'
import { sharePointApplicationHandler } from '../../common/helpers/sharepoint/sharepoint.js'
import { emailApplicationHandler } from '../../common/helpers/email/email.js'
import { stubModeApplicationHandler } from '../../common/helpers/stub-mode/stub-mode.js'

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

      const application = createApplication(request.payload)
      const reference = application.getNewReference()

      const handler = await getHandler(application)
      const result = await handler(request, reference)

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

const getHandler = async (application) => {
  const featureFlags = config.get('featureFlags')
  if (featureFlags.stubMode) {
    return stubModeApplicationHandler
  }

  if (
    application instanceof TbApplication &&
    featureFlags.sharepointIntegrationEnabled
  ) {
    return sharePointApplicationHandler
  }

  return emailApplicationHandler
}
