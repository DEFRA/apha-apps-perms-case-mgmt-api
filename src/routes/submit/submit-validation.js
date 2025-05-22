import { getQuestionFromSections } from '../../common/helpers/data-extract/data-extract.js'
import { ApplicationSchema } from './submit-payload-schema.js'

/**
 * @import {Request} from "@hapi/hapi/lib/types/request.js"
 * @import {ApplicationData} from "../../common/helpers/data-extract/data-extract.js"
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
  const { error, value } = ApplicationSchema.validate(request.payload, {
    abortEarly: false
  })

  if (error) {
    error.details.forEach((detail) => {
      // retrieve the original data at the path where the error occurred excluding the last item in the path to have some context
      const invalidValue = getValueAtPath(value, detail.path.slice(0, -1))
      request.logger.warn(
        `Schema validation failed: ${detail.message}. Payload fragment with invalid data: ${JSON.stringify(invalidValue)}`
      )
    })
  }

  const emailAddress = getQuestionFromSections(
    'emailAddress',
    'licence',
    request.payload?.sections
  )?.answer.displayText
  const fullName = getQuestionFromSections(
    'fullName',
    'licence',
    request.payload?.sections
  )?.answer.displayText

  if (!emailAddress) {
    request.logger.warn(
      'Invalid payload. emailAddress is missing in the payload'
    )
  }
  if (!fullName) {
    request.logger.warn('Invalid payload. fullName is missing in the payload')
  }
  return !error && !!emailAddress && !!fullName
}

const getValueAtPath = (obj, path) => {
  return path.reduce((acc, key) => acc[key], obj)
}
