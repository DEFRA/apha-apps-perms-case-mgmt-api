import { sendMessageToSQS } from '../../connectors/queue/sqs-producer.js'
import { statusCodes } from '../../constants/status-codes.js'

/** @import {HandlerError} from '../types.js' */
/** @import {Application, ApplicationData} from '../data-extract/application.js' */

/** @typedef {{ application: ApplicationData, reference: string }} QueuedApplication */

/**
 * @param {Application} application
 * @param {string} reference
 * @returns {Promise<void|HandlerError>}
 */
export const queueApplication = async (application, reference) => {
  try {
    await sendMessageToSQS(application.data, reference)
  } catch (error) {
    return {
      error: {
        errorCode: 'MESSAGE_ENQUEUEING_FAILED',
        statusCode: statusCodes.serverError
      }
    }
  }
  return undefined
}
