import { sendToCaseManagement } from '../../connectors/integration-bridge/index.js'

/** @import {HandlerError} from '../types.js' */

/**
 * @param {object} request
 * @param {string} reference
 * @returns {Promise<void|HandlerError>}
 */
export const caseManagementApplicationHandler = async (request, reference) => {
  await sendToCaseManagement(request.payload, reference)
  return undefined
}
