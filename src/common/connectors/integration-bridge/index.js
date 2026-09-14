import Wreck from '@hapi/wreck'
import { config } from '../../../config.js'
import { createApplication } from '../../helpers/data-extract/data-extract.js'
import { getApplicantDetails } from '../../helpers/applicant-details.js'

const MINIMUM_ERROR_STATUS_CODE = 400

/**
 * @param {{ tokenUrl: string, clientId: string, clientSecret: string, timeout: number }} configValues
 * @returns {Promise<{ access_token?: string }>}
 */
const getAccessToken = async ({
  tokenUrl,
  clientId,
  clientSecret,
  timeout
}) => {
  const credentials = `${clientId}:${clientSecret}`
  const payload = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret
  }).toString()

  const response = /** @type {{ access_token?: string }} */ (
    await post(
      tokenUrl,
      payload,
      {
        Authorization: `Basic ${Buffer.from(credentials).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      { timeout }
    )
  )

  if (!response.access_token) {
    throw new TypeError(
      'Integration bridge token response did not include an access token'
    )
  }

  return response
}

/**
 * @param {object} payload
 * @param {string} reference
 */
export async function sendToCaseManagement(payload, reference) {
  const configValues = config.get('integrationBridge')

  const response = await getAccessToken(configValues)

  const application = createApplication(payload)
  const { emailAddress, firstName, lastName } = getApplicantDetails(application)

  const completePayload = {
    ...payload,
    applicationReferenceNumber: reference,
    applicant: {
      type: 'guest',
      emailAddress,
      name: { firstName, lastName }
    }
  }

  return await postCase(completePayload, response.access_token, configValues)
}

/**
 * @param {object} payload
 * @param {string | undefined} accessToken
 * @param {{ baseUrl: string, timeout: number }} configValues
 * @returns {Promise<unknown>}
 */
const postCase = async (payload, accessToken, configValues) => {
  return await post(
    `${configValues.baseUrl}/case-management/case`,
    payload,
    {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    configValues
  )
}
/**
 * @param {string} url
 * @param {string} payload
 * @param {Record<string, string>} headers
 * @param {{ timeout: number }} configValues
 * @returns {Promise<unknown>}
 */
const post = async (url, payload, headers, { timeout }) => {
  const response = await Wreck.post(url, {
    payload,
    headers,
    timeout
  })

  const statusCode = response.res.statusCode ?? 0

  if (statusCode >= MINIMUM_ERROR_STATUS_CODE) {
    throw new TypeError(`Request failed (${statusCode}): ${url}`)
  }

  return response.payload?.length ? JSON.parse(response.payload) : undefined
}
