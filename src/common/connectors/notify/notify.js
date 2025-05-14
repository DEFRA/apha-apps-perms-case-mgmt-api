import Wreck from '@hapi/wreck'
import { config } from '../../../config.js'
import { createToken } from './notify-token-utils.js'
import { statusCodes } from '../../constants/status-codes.js'

/**
 * @typedef {{ content: string, link_to_file?: object}} CaseWorkerEmailParams
 * @typedef {{ applicant_name: string, application_reference_number: string }} ApplicantEmailParams
 * @typedef {{ email: string, fullName: string, reference: string }} ApplicantEmailData
 * @typedef {{ template_id: string | null , email_address: string | null, personalisation: CaseWorkerEmailParams | ApplicantEmailParams }} NotifyPayload
 */

/**
 * @param {CaseWorkerEmailParams} data
 */
export async function sendEmailToCaseWorker(data) {
  const { templateId, emailAddress } = config.get('notify').caseDelivery

  const payload = {
    template_id: templateId,
    email_address: emailAddress,
    personalisation: {
      content: data.content,
      link_to_file: data.link_to_file ?? ''
    }
  }

  return sendNotification(payload)
}

/**
 * @param {ApplicantEmailData} data
 */
export async function sendEmailToApplicant(data) {
  const { templateId } = config.get('notify').applicantConfirmation

  const payload = {
    template_id: templateId,
    email_address: data.email,
    personalisation: {
      applicant_name: data.fullName,
      application_reference_number: data.reference
    }
  }

  return sendNotification(payload)
}

/**
 * @param {NotifyPayload} payload
 */
async function sendNotification(payload) {
  const { ...notifyConfig } = config.get('notify')

  let response

  try {
    response = await Wreck.post(notifyConfig.url, {
      payload: JSON.stringify(payload),
      headers: {
        Authorization: 'Bearer ' + createToken(notifyConfig.apiKey)
      },
      timeout: notifyConfig.timeout
    })
  } catch (err) {
    if (err.output?.statusCode === statusCodes.gatewayTimeout) {
      throw new Error(
        `Request to GOV.uk notify timed out after ${notifyConfig.timeout}ms`
      )
    } else if (err.data) {
      const errors = JSON.parse(err.data.payload?.toString())
      const errorMessages = errors.errors.map((error) => error.message)
      throw new Error(
        `HTTP failure from GOV.uk notify: status ${errors.statusCode} with the following errors: ${errorMessages.join(', ')}`
      )
    } else {
      throw new Error(
        `Request to GOV.uk notify failed with error: ${err.message}`
      )
    }
  }

  return JSON.parse(response.payload.toString())
}
