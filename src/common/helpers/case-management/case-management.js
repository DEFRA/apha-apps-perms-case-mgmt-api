import { sendToCaseManagement } from '../../connectors/integration-bridge/index.js'

/**
 * @import {HandlerError} from '../types.js'
 * @import {Application} from '../../helpers/data-extract/application.js'
 */

/**
 * @param {Application} application
 * @param {string} reference
 * @returns {Promise<void|HandlerError>}
 */
export const processApplication = async (application, reference) => {
  await sendToCaseManagement(application, reference)
}
