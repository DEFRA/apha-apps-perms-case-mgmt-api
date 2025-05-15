import { createLogger } from './logging/logger.js'

/** @import { Lifecycle } from '@hapi/hapi' */

const logger = createLogger()

/** @type {Lifecycle.FailAction} */
/** @satisfies {function} */
export const failAction = (_request, _h, error) => {
  logger.warn(error, error?.message)
  throw error
}
