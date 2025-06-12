import { statusCodes } from '../../common/constants/status-codes.js'

import { getApplicationReference } from '../../common/helpers/application-reference/application-reference.js'

import { isValidPayload, isValidRequest } from './submit-validation.js'

import { config } from '../../config.js'
import { sharePointApplicationHandler } from '../../common/helpers/sharepoint/sharepoint.js'
import { emailApplicationHandler } from '../../common/helpers/email/email.js'

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

      // Sharepoint integration enabled
      if (config.get('featureFlags').sharepointIntegrationEnabled) {
        const result = await sharePointApplicationHandler(request, reference)
        if (result?.error) {
          return h
            .response({ error: result.error.errorCode })
            .code(result.error.statusCode)
        }
      }

      // Sharepoint integration disabled
      else {
        const result = await emailApplicationHandler(request, reference)
        if (result?.error) {
          return h
            .response({ error: result.error.errorCode })
            .code(result.error.statusCode)
        }
      }

      request.logger.info(
        `Application submitted successfully with reference: ${reference}`
      )

      return h.response({ message: reference }).code(statusCodes.ok)
    }
  }
]
