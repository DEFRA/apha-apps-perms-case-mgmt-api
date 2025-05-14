import { getQuestionFromSections } from '../../common/helpers/data-extract/data-extract.js'

/**
 * @import {Request} from "@hapi/hapi/lib/types/request.js"
 * @import {SectionData, QuestionAnswerData} from "../../common/helpers/data-extract/data-extract.js"
 */

/**
 * @param {Request} request
 * @returns {boolean}
 */
export const isValidRequest = (request) => {
  const headers = request.headers
  const contentType = headers['content-type'] || headers['Content-Type']
  const isValidContentType =
    contentType && contentType.includes('application/json')
  if (!isValidContentType) {
    request.logger.warn(
      'Invalid request. Content-Type header is missing or it does not include application/json'
    )
  }
  return !!isValidContentType
}

/**
 * @param {Request} request
 * @returns {boolean}
 */
/**
 * @param {object} request
 * @param {object} request.payload
 * @param {SectionData[]} request.payload.sections
 * @param {object} request.logger
 * @returns {boolean}
 */
export const isValidPayload = (request) => {
  const emailAddress = /** @type {QuestionAnswerData} */ (
    getQuestionFromSections(
      'emailAddress',
      'licence',
      request.payload?.sections
    )
  )?.answer.displayText
  const fullName = /** @type {QuestionAnswerData} */ (
    getQuestionFromSections('fullName', 'licence', request.payload?.sections)
  )?.answer.displayText
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
