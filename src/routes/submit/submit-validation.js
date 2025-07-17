import { createApplication } from '../../common/helpers/data-extract/data-extract.js'
import { ApplicationSchema } from './submit-payload-schema.js'

/**
 * @import {Request} from "@hapi/hapi/lib/types/request.js"
 * @import {ApplicationData} from "../../common/helpers/data-extract/application.js"
 */

/**
 * @param {Request} request
 * @returns {boolean}
 */
export const isValidRequest = (request) => {
  const headers = request.headers
  const contentType = headers['content-type'] || headers['Content-Type']
  if (!contentType) {
    request.logger.warn('Invalid request. Content-Type header is missing')
    return false
  }
  if (!contentType.includes('application/json')) {
    request.logger.warn(
      'Invalid request. Content-Type header does not include application/json'
    )
    return false
  }
  return true
}

/**
 * @param {{payload: ApplicationData, logger: object}} request
 * @returns {boolean}
 */
export const isValidPayload = (request) => {
  const { error } = ApplicationSchema.validate(request.payload, {
    abortEarly: false
  })

  if (error) {
    request.logger.warn(
      `Schema validation failed: ${error.details.map((detail) => detail.message).join(', ')}.`
    )
    return false
  }

  const application = createApplication(request.payload)

  // continue validation only if schema validation is successful
  const emailAddress = application.emailAddress
  const fullName = application.applicantName

  if (!emailAddress) {
    request.logger.warn(
      'Invalid payload. emailAddress is missing in the payload'
    )
  }
  if (!fullName) {
    request.logger.warn('Invalid payload. fullName is missing in the payload')
  }
  return !!emailAddress && !!fullName
}
